import { MongoClient, ObjectId, ServerApiVersion, type Document, type OptionalUnlessRequiredId } from "mongodb";
import { createHash } from "node:crypto";
import nodemailer from "nodemailer";

const uri = process.env.MONGODB_URI ?? import.meta?.env?.VITE_MONGODB_URI ?? "";

if (!uri) {
  throw new Error(
    "Missing MongoDB connection string. Set MONGODB_URI or VITE_MONGODB_URI in your environment."
  );
}

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalWithMongo._mongoClientPromise ??
  (globalWithMongo._mongoClientPromise = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }).connect());

export type MongoRecord = { [key: string]: unknown };

export interface UserRecord {
  _id?: string | ObjectId;
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  status?: "Active" | "Pending" | "Suspended" | "Rejected";
  createdAt: string;
  profileCompleted: boolean;
  displayName?: string;
  affiliation?: string;
  bio?: string;
  phone?: string;
  researchInterests?: string;
  profileImage?: string;
  provider?: string;
  providerId?: string;
  photoURL?: string;
  department?: string;
  degree?: string;
  credentials?: string;
  approvalDate?: string;
  approvedBy?: string;
  updatedAt?: string;
}

export interface AnnouncementRecord {
  _id?: string | ObjectId;
  id?: string;
  title: string;
  content: string;
  targetAudience: "All" | "Students" | "Faculty";
  priority: "Low" | "Normal" | "High" | "Urgent";
  pinned: boolean;
  published: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogRecord {
  _id?: string | ObjectId;
  id?: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole: string;
  actionType: "USER_MANAGEMENT" | "FACULTY_APPROVAL" | "PROJECT_ACTION" | "PAPER_ACTION" | "ANNOUNCEMENT" | "SYSTEM_SETTING" | "SECURITY";
  description: string;
  details?: string;
  ipAddress?: string;
}

export interface ProjectRecord {
  _id?: string | ObjectId;
  id?: string;
  userEmail: string;
  title: string;
  description: string;
  domain: string;
  status: "Planning" | "In Progress" | "Under Review" | "Completed" | "On Hold";
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  faculty?: string;
  createdAt: string;
  updatedAt: string;
}

/* ── OTP In-Memory Store ── */
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function findUserByEmail(email: string, dbName = "scholarnexus") {
  const collection = await getCollection<UserRecord>("users", dbName);
  const normalized = email.trim().toLowerCase();
  return collection.findOne({
    $or: [
      { email: normalized },
      { email: { $regex: `^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
    ],
  });
}

export async function findUserByProvider(
  provider: string,
  providerId: string,
  dbName = "scholarnexus"
) {
  const collection = await getCollection<UserRecord>("users", dbName);
  return collection.findOne({ provider, providerId });
}

export async function authenticateUser(
  email: string,
  password: string,
  dbName = "scholarnexus"
) {
  const user = await findUserByEmail(email, dbName);
  if (!user) return null;
  const hashed = hashPassword(password);
  return user.password === hashed ? user : null;
}

export async function registerUser(
  user: { name: string; email: string; password: string; role: string },
  dbName = "scholarnexus"
) {
  const status = user.role === "faculty" ? "Pending" : "Active";
  const record: UserRecord = {
    name: user.name,
    email: user.email.trim().toLowerCase(),
    password: hashPassword(user.password),
    role: user.role,
    status,
    createdAt: new Date().toISOString(),
    profileCompleted: false,
  };
  return insertDocument("users", record, dbName);
}

export async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  name: string,
  photoURL?: string,
  role?: string,
  dbName = "scholarnexus"
) {
  const collection = await getCollection<UserRecord>("users", dbName);
  const providerUser = await findUserByProvider(provider, providerId, dbName);
  if (providerUser) return providerUser;

  const emailUser = await findUserByEmail(email, dbName);
  if (emailUser) {
    const updatePayload: Record<string, any> = {
      provider,
      providerId,
      photoURL,
    };
    if (role && (role === "student" || role === "faculty")) {
      updatePayload.role = role;
    }
    await collection.updateOne(
      { email: email.trim().toLowerCase() },
      {
        $set: updatePayload,
      },
    );
    return { ...emailUser, ...updatePayload };
  }

  const record: UserRecord = {
    name,
    email: email.trim().toLowerCase(),
    password: "",
    role: role && (role === "student" || role === "faculty") ? role : "student",
    createdAt: new Date().toISOString(),
    profileCompleted: false,
    provider,
    providerId,
    photoURL,
  };

  const result = await insertDocument("users", record, dbName);
  return { ...record, _id: result.insertedId } as UserRecord;
}

export async function completeUserProfile(
  email: string,
  updates: { displayName: string; affiliation: string; bio: string },
  dbName = "scholarnexus"
) {
  const collection = await getCollection<UserRecord>("users", dbName);
  return collection.updateOne(
    { email: email.trim().toLowerCase() },
    {
      $set: {
        profileCompleted: true,
        displayName: updates.displayName,
        affiliation: updates.affiliation,
        bio: updates.bio,
      },
    },
  );
}

async function sendOtpEmail(email: string, otp: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const isRealSmtp =
    smtpHost &&
    smtpUser &&
    smtpPass &&
    !smtpUser.includes("your-gmail-address") &&
    !smtpUser.includes("example");

  if (isRealSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"ScholarNexus AI" <${process.env.SMTP_FROM ?? smtpUser}>`,
        to: email,
        subject: `ScholarNexus AI — Verification Code: ${otp}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #333; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #2A9D8F; margin: 0 0 12px 0; font-size: 20px;">ScholarNexus AI</h2>
            <p style="font-size: 14px; margin-bottom: 8px;">Hello,</p>
            <p style="font-size: 14px; color: #475569;">You requested a verification code to reset your ScholarNexus AI password.</p>
            <p style="font-size: 14px; font-weight: bold; margin-top: 16px;">Your 6-Digit Verification Code is:</p>
            <div style="background: #f0fdf4; border: 2px solid #2A9D8F; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2A9D8F; text-align: center; padding: 18px; margin: 16px 0; border-radius: 10px;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This code is valid for 10 minutes. Enter this code on the OTP verification screen to set your new password.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">ScholarNexus AI — Academic Research Ecosystem</p>
          </div>
        `,
      });
      console.log(`[ScholarNexus SMTP Email Sent] Successfully sent 6-digit OTP code to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error("[SMTP Delivery Error]", err);
    }
  }

  // Automatic Ethereal / Test Transport for local testing email delivery
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: `"ScholarNexus AI" <no-reply@scholarnexus.ai>`,
      to: email,
      subject: `ScholarNexus AI — Verification Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2A9D8F;">ScholarNexus AI</h2>
          <p>Your 6-digit password reset verification code is:</p>
          <div style="background: #f0fdf4; border: 2px solid #2A9D8F; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2A9D8F; text-align: center; padding: 16px; margin: 16px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #64748b;">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    console.log(`\n==============================================`);
    console.log(`[ScholarNexus OTP Email Sent] To: ${email} | OTP Code: ${otp}`);
    console.log(`[Ethereal Preview URL]: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`==============================================\n`);
    return { sent: true, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (testErr) {
    console.log(`\n==============================================`);
    console.log(`[ScholarNexus OTP Email Fallback] To: ${email} | 6-Digit OTP Code: ${otp}`);
    console.log(`==============================================\n`);
  }

  return { sent: true };
}

async function getDatabase(dbName = "scholarnexus") {
  const client = await clientPromise;
  return client.db(dbName);
}

async function getCollection<T extends Document = Document>(collectionName: string, dbName = "scholarnexus") {
  const db = await getDatabase(dbName);
  return db.collection<T>(collectionName);
}

export async function findAllDocuments<T extends Document = Document>(
  collectionName: string,
  dbName = "scholarnexus"
) {
  const collection = await getCollection<T>(collectionName, dbName);
  return collection.find().toArray();
}

export async function insertDocument<T extends Document = Document>(
  collectionName: string,
  document: OptionalUnlessRequiredId<T>,
  dbName = "scholarnexus"
) {
  const collection = await getCollection<T>(collectionName, dbName);
  return collection.insertOne(document);
}

export async function findProjectsByUser(userEmail: string, search?: string, status?: string) {
  try {
    const collection = await getCollection<Document>("projects");
    const normalizedEmail = userEmail.trim().toLowerCase();

    const query: Record<string, any> = {
      $or: [
        { userEmail: normalizedEmail },
        { userEmail: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
      ],
    };

    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$and = [
        {
          $or: [
            { title: { $regex: s, $options: "i" } },
            { description: { $regex: s, $options: "i" } },
            { domain: { $regex: s, $options: "i" } },
            { faculty: { $regex: s, $options: "i" } },
          ],
        },
      ];
    }

    const docs = await collection.find(query).sort({ updatedAt: -1, createdAt: -1 }).toArray();
    return docs.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }));
  } catch (err) {
    console.error("Error in findProjectsByUser:", err);
    return [];
  }
}

export async function createProject(project: Omit<ProjectRecord, "_id">) {
  const collection = await getCollection<Document>("projects");
  const result = await collection.insertOne(project as any);
  return {
    ...project,
    id: result.insertedId.toString(),
    _id: result.insertedId.toString(),
  };
}

export async function updateProject(id: string, userEmail: string, updates: Partial<ProjectRecord>) {
  const collection = await getCollection<Document>("projects");
  const normalizedEmail = userEmail.trim().toLowerCase();

  let filterId: any = id;
  try {
    if (ObjectId.isValid(id)) {
      filterId = new ObjectId(id);
    }
  } catch {
    // fallback
  }

  const existing = await collection.findOne({
    $or: [{ _id: filterId }, { _id: id }, { id: id }],
  });

  if (!existing) {
    return null;
  }

  if (existing.userEmail?.toLowerCase() !== normalizedEmail) {
    throw new Error("Unauthorized to modify this project.");
  }

  const { _id, id: _ignoreId, ...cleanUpdates } = updates as any;
  cleanUpdates.updatedAt = new Date().toISOString();

  await collection.updateOne(
    { _id: existing._id },
    { $set: cleanUpdates }
  );

  const updatedDoc = await collection.findOne({ _id: existing._id });
  return updatedDoc
    ? { ...updatedDoc, id: updatedDoc._id.toString(), _id: updatedDoc._id.toString() }
    : null;
}

export async function deleteProject(id: string, userEmail: string) {
  const collection = await getCollection<Document>("projects");
  const normalizedEmail = userEmail.trim().toLowerCase();

  let filterId: any = id;
  try {
    if (ObjectId.isValid(id)) {
      filterId = new ObjectId(id);
    }
  } catch {
    // fallback
  }

  const existing = await collection.findOne({
    $or: [{ _id: filterId }, { _id: id }, { id: id }],
  });

  if (!existing) {
    return false;
  }

  if (existing.userEmail?.toLowerCase() !== normalizedEmail) {
    throw new Error("Unauthorized to delete this project.");
  }

  const res = await collection.deleteOne({ _id: existing._id });
  return res.deletedCount > 0;
}

function validateProjectPayload(body: any) {
  const title = (body.title || "").trim();
  if (!title) {
    return "Project Title is required.";
  }
  if (title.length < 3) {
    return "Project Title must be at least 3 characters long.";
  }
  if (title.length > 150) {
    return "Project Title cannot exceed 150 characters.";
  }

  const description = (body.description || "").trim();
  if (description.length > 1000) {
    return "Description cannot exceed 1000 characters.";
  }

  const domain = (body.domain || "").trim();
  if (!domain) {
    return "Research Domain is required.";
  }

  const status = body.status;
  const validStatuses = ["Planning", "In Progress", "Under Review", "Completed", "On Hold"];
  if (!status || !validStatuses.includes(status)) {
    return "Please select a valid Project Status.";
  }

  const progress = Number(body.progress);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    return "Progress completion must be between 0% and 100%.";
  }

  const startDateStr = body.startDate;
  if (!startDateStr) {
    return "Start Date is required.";
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (startDateStr < todayStr) {
    return "Start Date cannot be a prior date (before today).";
  }

  const expectedCompletionDateStr = body.expectedCompletionDate;
  if (!expectedCompletionDateStr) {
    return "Expected Completion Date is required.";
  }

  const startMs = new Date(startDateStr).getTime();
  const completionMs = new Date(expectedCompletionDateStr).getTime();

  if (isNaN(startMs) || isNaN(completionMs)) {
    return "Invalid date format.";
  }

  const diffDays = (completionMs - startMs) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) {
    return "Expected Completion Date must be at least 1 week (7 days) after the Start Date.";
  }

  return null;
}

/* ── Admin Management & Analytics Helpers ── */

export async function logActivity(
  userName: string,
  userEmail: string,
  userRole: string,
  actionType: ActivityLogRecord["actionType"],
  description: string,
  details?: string
) {
  try {
    const collection = await getCollection<Document>("activity_logs");
    const record: ActivityLogRecord = {
      timestamp: new Date().toISOString(),
      userName: userName || "System Admin",
      userEmail: userEmail || "admin@scholarnexus.ai",
      userRole: userRole || "admin",
      actionType,
      description,
      details,
      ipAddress: "127.0.0.1",
    };
    await collection.insertOne(record as any);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function ensureAdminSeedData() {
  try {
    const usersCol = await getCollection<UserRecord>("users");
    const userCount = await usersCol.countDocuments();

    // 1. Ensure Admin User exists
    const adminEmail = "admin@scholarnexus.ai";
    const existingAdmin = await usersCol.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await usersCol.insertOne({
        name: "Enterprise Admin",
        email: adminEmail,
        password: hashPassword("admin123"),
        role: "admin",
        status: "Active",
        createdAt: new Date().toISOString(),
        profileCompleted: true,
        displayName: "Dr. Admin Workspace",
        affiliation: "ScholarNexus Central Administration",
        bio: "Lead System Administrator & Academic Research Coordinator.",
        department: "Central IT & Research Ops",
      });
    }

    // 2. Seed default users if count is low (< 5)
    if (userCount < 5) {
      const sampleUsers: Partial<UserRecord>[] = [
        {
          name: "Dr. Aris Thorne",
          email: "athorne@university.edu",
          password: hashPassword("password123"),
          role: "faculty",
          status: "Active",
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          profileCompleted: true,
          displayName: "Dr. Aris Thorne",
          affiliation: "Department of Artificial Intelligence",
          department: "Computer Science & AI",
          degree: "Ph.D. in Computer Science (MIT)",
          researchInterests: "Deep Learning, Multi-agent Systems, NLP",
        },
        {
          name: "Prof. Elena Rostova",
          email: "erostova@stanford.edu",
          password: hashPassword("password123"),
          role: "faculty",
          status: "Pending",
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          profileCompleted: true,
          displayName: "Prof. Elena Rostova",
          affiliation: "Stanford Quantum Institute",
          department: "Physics & Quantum Computing",
          degree: "Ph.D. in Quantum Physics (Stanford)",
          credentials: "https://credentials.example.edu/rostova-cv.pdf",
          researchInterests: "Quantum Information Theory, Entanglement",
        },
        {
          name: "Dr. Marcus Vance",
          email: "mvance@oxford.ac.uk",
          password: hashPassword("password123"),
          role: "faculty",
          status: "Pending",
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          profileCompleted: true,
          displayName: "Dr. Marcus Vance",
          affiliation: "Oxford Department of Oncology",
          department: "Biomedical Sciences",
          degree: "M.D., Ph.D. (Oxford)",
          credentials: "https://credentials.example.edu/vance-verification.pdf",
          researchInterests: "Genomic Oncology, Target Discovery",
        },
        {
          name: "Sophia Chen",
          email: "sophia.chen@student.edu",
          password: hashPassword("password123"),
          role: "student",
          status: "Active",
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          profileCompleted: true,
          displayName: "Sophia Chen",
          affiliation: "School of Engineering",
          department: "Computer Science",
          researchInterests: "Computer Vision, Neural Rendering",
        },
        {
          name: "Liam O'Connor",
          email: "liam.oc@student.edu",
          password: hashPassword("password123"),
          role: "student",
          status: "Active",
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          profileCompleted: true,
          displayName: "Liam O'Connor",
          affiliation: "School of Data Science",
          department: "Data Science",
          researchInterests: "Predictive Analytics, Graph Neural Networks",
        },
        {
          name: "Maya Patel",
          email: "mpatel@student.edu",
          password: hashPassword("password123"),
          role: "student",
          status: "Suspended",
          createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
          profileCompleted: true,
          displayName: "Maya Patel",
          affiliation: "Department of Bioengineering",
          department: "Bioinformatics",
          researchInterests: "Protein Folding, CRISPR",
        },
      ];

      for (const u of sampleUsers) {
        const found = await usersCol.findOne({ email: u.email });
        if (!found) {
          await usersCol.insertOne(u as any);
        }
      }
    }

    // 3. Ensure Projects exist
    const projectsCol = await getCollection<Document>("projects");
    const projCount = await projectsCol.countDocuments();
    if (projCount === 0) {
      const sampleProjects = [
        {
          userEmail: "sophia.chen@student.edu",
          title: "Neural Radiance Fields for Academic 3D Rendering",
          description: "Exploring NeRF optimizations for real-time spatial visualization in medical imaging.",
          domain: "Artificial Intelligence",
          status: "In Progress",
          progress: 68,
          startDate: new Date(Date.now() - 40 * 86400000).toISOString().split("T")[0],
          expectedCompletionDate: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
          faculty: "Dr. Aris Thorne",
          createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userEmail: "liam.oc@student.edu",
          title: "Scalable Graph Transformers in Molecular Discovery",
          description: "Applying spatial-aware graph neural networks to predict binding affinities of small molecules.",
          domain: "Bioinformatics & AI",
          status: "Under Review",
          progress: 90,
          startDate: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0],
          expectedCompletionDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
          faculty: "Dr. Aris Thorne",
          createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userEmail: "sophia.chen@student.edu",
          title: "Quantum Key Distribution Protocols in Mesh Networks",
          description: "Evaluating QKD fault tolerance in low-latency wireless topologies.",
          domain: "Quantum Computing",
          status: "Planning",
          progress: 25,
          startDate: new Date().toISOString().split("T")[0],
          expectedCompletionDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
          faculty: "Prof. Elena Rostova",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      await projectsCol.insertMany(sampleProjects);
    }

    // 4. Ensure Papers exist
    const papersCol = await getCollection<Document>("papers");
    const paperCount = await papersCol.countDocuments();
    if (paperCount === 0) {
      const samplePapers = [
        {
          title: "High-Throughput Genome Assembly via Hybrid Transformer Architectures",
          authors: "Liam O'Connor, Dr. Aris Thorne",
          domain: "Bioinformatics",
          summary: "Presents a novel hybrid model accelerating long-read sequencing analysis by 4.2x.",
          uploaderEmail: "liam.oc@student.edu",
          fileSize: "4.8 MB",
          downloadUrl: "#",
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          title: "Robustness Bounds of Deep Neural Networks under Adversarial Perturbations",
          authors: "Sophia Chen, Dr. Aris Thorne",
          domain: "Computer Vision & Security",
          summary: "Establishes tight theoretical lower bounds for norm-bounded adversarial attacks.",
          uploaderEmail: "sophia.chen@student.edu",
          fileSize: "2.3 MB",
          downloadUrl: "#",
          createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        },
      ];
      await papersCol.insertMany(samplePapers);
    }

    // 5. Ensure Announcements exist
    const announcementsCol = await getCollection<Document>("announcements");
    const annCount = await announcementsCol.countDocuments();
    if (annCount === 0) {
      const sampleAnnouncements = [
        {
          title: "Fall 2026 Research Grant Applications Now Open",
          content: "Grants up to $25,000 are available for multidisciplinary AI & Quantum research proposals. Submissions close Oct 15.",
          targetAudience: "All",
          priority: "High",
          pinned: true,
          published: true,
          authorName: "Enterprise Admin",
          authorEmail: adminEmail,
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          title: "Faculty Mentorship Portal Maintenance Notice",
          content: "Scheduled maintenance will occur this Saturday between 02:00 UTC and 04:00 UTC. System services will remain uninterrupted.",
          targetAudience: "Faculty",
          priority: "Normal",
          pinned: false,
          published: true,
          authorName: "Enterprise Admin",
          authorEmail: adminEmail,
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
      ];
      await announcementsCol.insertMany(sampleAnnouncements);
    }

    // 6. Ensure Activity Logs exist
    const activityCol = await getCollection<Document>("activity_logs");
    const actCount = await activityCol.countDocuments();
    if (actCount === 0) {
      const sampleLogs = [
        {
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          userName: "Enterprise Admin",
          userEmail: adminEmail,
          userRole: "admin",
          actionType: "SYSTEM_SETTING",
          description: "Updated System Security & Session Policies",
          details: "Enforced 2FA requirements for all faculty level accounts.",
          ipAddress: "192.168.1.100",
        },
        {
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          userName: "Enterprise Admin",
          userEmail: adminEmail,
          userRole: "admin",
          actionType: "FACULTY_APPROVAL",
          description: "Reviewed Faculty Application for Prof. Elena Rostova",
          details: "Application marked as pending document verification.",
          ipAddress: "192.168.1.100",
        },
        {
          timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
          userName: "Sophia Chen",
          userEmail: "sophia.chen@student.edu",
          userRole: "student",
          actionType: "PROJECT_ACTION",
          description: "Created Research Project: Neural Radiance Fields",
          details: "Assigned advisor: Dr. Aris Thorne",
          ipAddress: "10.0.4.12",
        },
      ];
      await activityCol.insertMany(sampleLogs);
    }
  } catch (err) {
    console.error("Error ensuring admin seed data:", err);
  }
}

export async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  // ── Public Announcements API ──
  if (url.pathname === "/api/announcements") {
    if (request.method === "GET") {
      await ensureAdminSeedData();
      const col = await getCollection<Document>("announcements");
      const list = await col.find({ published: true }).sort({ pinned: -1, createdAt: -1 }).toArray();
      const formatted = list.map((doc) => ({ ...doc, id: doc._id.toString() }));
      return new Response(JSON.stringify(formatted), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Admin Stats & Analytics API ──
  if (url.pathname === "/api/admin/stats") {
    if (request.method === "GET") {
      await ensureAdminSeedData();
      const usersCol = await getCollection<UserRecord>("users");
      const projectsCol = await getCollection<Document>("projects");
      const papersCol = await getCollection<Document>("papers");

      const totalStudents = await usersCol.countDocuments({ role: "student" });
      const totalFaculty = await usersCol.countDocuments({ role: "faculty" });
      const totalProjects = await projectsCol.countDocuments();
      const totalPapers = await papersCol.countDocuments();
      const pendingFacultyApprovals = await usersCol.countDocuments({
        role: "faculty",
        status: "Pending",
      });
      const activeUsers = await usersCol.countDocuments({ status: { $ne: "Suspended" } });

      const userGrowth = [
        { month: "Feb", students: Math.max(12, totalStudents - 18), faculty: Math.max(2, totalFaculty - 5) },
        { month: "Mar", students: Math.max(18, totalStudents - 12), faculty: Math.max(3, totalFaculty - 4) },
        { month: "Apr", students: Math.max(24, totalStudents - 8), faculty: Math.max(4, totalFaculty - 3) },
        { month: "May", students: Math.max(32, totalStudents - 5), faculty: Math.max(5, totalFaculty - 2) },
        { month: "Jun", students: Math.max(40, totalStudents - 2), faculty: Math.max(6, totalFaculty - 1) },
        { month: "Jul", students: totalStudents, faculty: totalFaculty },
      ];

      const projectStatus = [
        { name: "Planning", value: await projectsCol.countDocuments({ status: "Planning" }) || 4 },
        { name: "In Progress", value: await projectsCol.countDocuments({ status: "In Progress" }) || 8 },
        { name: "Under Review", value: await projectsCol.countDocuments({ status: "Under Review" }) || 5 },
        { name: "Completed", value: await projectsCol.countDocuments({ status: "Completed" }) || 6 },
        { name: "On Hold", value: await projectsCol.countDocuments({ status: "On Hold" }) || 2 },
      ];

      const researchDomains = [
        { domain: "AI / ML", count: 18 },
        { domain: "Quantum Computing", count: 12 },
        { domain: "Bioinformatics", count: 14 },
        { domain: "Cybersecurity", count: 9 },
        { domain: "Data Science", count: 16 },
      ];

      const monthlyPapers = [
        { month: "Feb", papers: 4 },
        { month: "Mar", papers: 8 },
        { month: "Apr", papers: 12 },
        { month: "May", papers: 15 },
        { month: "Jun", papers: 19 },
        { month: "Jul", papers: totalPapers },
      ];

      return new Response(
        JSON.stringify({
          totalStudents,
          totalFaculty,
          totalProjects,
          totalPapers,
          pendingFacultyApprovals,
          activeUsers,
          userGrowth,
          projectStatus,
          researchDomains,
          monthlyPapers,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
  }

  // ── Admin User Management API ──
  if (url.pathname === "/api/admin/users") {
    await ensureAdminSeedData();
    const col = await getCollection<UserRecord>("users");

    if (request.method === "GET") {
      const search = url.searchParams.get("search")?.toLowerCase().trim();
      const role = url.searchParams.get("role");
      const status = url.searchParams.get("status");

      const query: Record<string, any> = {};
      if (role && role !== "All") query.role = role.toLowerCase();
      if (status && status !== "All") query.status = status;

      const docs = await col.find(query).sort({ createdAt: -1 }).toArray();

      let filtered = docs.map((u) => ({
        ...u,
        id: u._id.toString(),
        _id: u._id.toString(),
        status: u.status || (u.role === "faculty" ? "Pending" : "Active"),
      }));

      if (search) {
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            (u.affiliation && u.affiliation.toLowerCase().includes(search))
        );
      }

      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400 });
      }

      const { id, email, role, status, name, affiliation, bio, department } = body;
      const targetEmail = (email || body.userEmail)?.trim().toLowerCase();

      if (!targetEmail && !id) {
        return new Response(JSON.stringify({ error: "User identifier required." }), { status: 400 });
      }

      const updatePayload: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (role) updatePayload.role = role.toLowerCase();
      if (status) updatePayload.status = status;
      if (name) {
        updatePayload.name = name;
        updatePayload.displayName = name;
      }
      if (affiliation) updatePayload.affiliation = affiliation;
      if (bio) updatePayload.bio = bio;
      if (department) updatePayload.department = department;

      let filter: any = { email: targetEmail };
      if (id && ObjectId.isValid(id)) {
        filter = { $or: [{ _id: new ObjectId(id) }, { email: targetEmail }] };
      }

      await col.updateOne(filter, { $set: updatePayload });

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "USER_MANAGEMENT",
        `Updated user account (${targetEmail})`,
        `Role: ${role ?? "unchanged"}, Status: ${status ?? "unchanged"}`
      );

      return new Response(JSON.stringify({ success: true, message: "User updated successfully." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "DELETE") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {}

      const userId = url.searchParams.get("id") || body.id;
      const email = (url.searchParams.get("email") || body.email)?.trim().toLowerCase();

      if (!userId && !email) {
        return new Response(JSON.stringify({ error: "User ID or Email is required." }), { status: 400 });
      }

      let filter: any = { email };
      if (userId && ObjectId.isValid(userId)) {
        filter = { $or: [{ _id: new ObjectId(userId) }, { email }] };
      }

      await col.deleteOne(filter);

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "USER_MANAGEMENT",
        `Deleted user account (${email || userId})`,
        "Permanent user deletion."
      );

      return new Response(JSON.stringify({ success: true, message: "User deleted successfully." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Admin Faculty Approvals API ──
  if (url.pathname === "/api/admin/faculty/approval") {
    await ensureAdminSeedData();
    const col = await getCollection<UserRecord>("users");

    if (request.method === "GET") {
      const statusFilter = url.searchParams.get("status") || "Pending";
      const query: Record<string, any> = { role: "faculty" };

      if (statusFilter !== "All") {
        query.status = statusFilter;
      }

      const facultyList = await col.find(query).sort({ createdAt: -1 }).toArray();
      const formatted = facultyList.map((f) => ({
        ...f,
        id: f._id.toString(),
        _id: f._id.toString(),
        status: f.status || "Pending",
      }));

      return new Response(JSON.stringify(formatted), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400 });
      }

      const { email, id, action, reason } = body;
      const targetEmail = email?.trim().toLowerCase();

      if (!action || (action !== "approve" && action !== "reject")) {
        return new Response(JSON.stringify({ error: "Action must be 'approve' or 'reject'." }), {
          status: 400,
        });
      }

      let filter: any = { email: targetEmail };
      if (id && ObjectId.isValid(id)) {
        filter = { $or: [{ _id: new ObjectId(id) }, { email: targetEmail }] };
      }

      const newStatus = action === "approve" ? "Active" : "Rejected";
      const updateData: Record<string, any> = {
        status: newStatus,
        approvalDate: new Date().toISOString(),
        approvedBy: "admin@scholarnexus.ai",
        updatedAt: new Date().toISOString(),
      };
      if (reason) updateData.approvalReason = reason;

      await col.updateOne(filter, { $set: updateData });

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "FACULTY_APPROVAL",
        `${action === "approve" ? "Approved" : "Rejected"} faculty application for ${targetEmail}`,
        reason ? `Reason: ${reason}` : undefined
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Faculty request ${action === "approve" ? "approved" : "rejected"} successfully.`,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
  }

  // ── Admin Research Projects API ──
  if (url.pathname === "/api/admin/projects") {
    await ensureAdminSeedData();
    const col = await getCollection<Document>("projects");

    if (request.method === "GET") {
      const search = url.searchParams.get("search")?.toLowerCase().trim();
      const status = url.searchParams.get("status");
      const domain = url.searchParams.get("domain");

      const query: Record<string, any> = {};
      if (status && status !== "All") query.status = status;
      if (domain && domain !== "All") query.domain = domain;

      const docs = await col.find(query).sort({ updatedAt: -1, createdAt: -1 }).toArray();

      let filtered = docs.map((p) => ({
        ...p,
        id: p._id.toString(),
        _id: p._id.toString(),
      }));

      if (search) {
        filtered = filtered.filter(
          (p: any) =>
            p.title?.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search) ||
            p.userEmail?.toLowerCase().includes(search) ||
            p.faculty?.toLowerCase().includes(search)
        );
      }

      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400 });
      }

      const { id, action } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Project ID is required." }), { status: 400 });
      }

      let filterId: any = id;
      if (ObjectId.isValid(id)) filterId = new ObjectId(id);

      if (action === "archive") {
        await col.updateOne({ $or: [{ _id: filterId }, { id }] }, { $set: { status: "On Hold", archived: true } });
        await logActivity(
          "Enterprise Admin",
          "admin@scholarnexus.ai",
          "admin",
          "PROJECT_ACTION",
          `Archived research project (ID: ${id})`
        );
      }

      return new Response(JSON.stringify({ success: true, message: "Project updated." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "DELETE") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {}

      const id = url.searchParams.get("id") || body.id;
      if (!id) {
        return new Response(JSON.stringify({ error: "Project ID is required." }), { status: 400 });
      }

      let filterId: any = id;
      if (ObjectId.isValid(id)) filterId = new ObjectId(id);

      await col.deleteOne({ $or: [{ _id: filterId }, { id }] });

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "PROJECT_ACTION",
        `Deleted research project (ID: ${id})`
      );

      return new Response(JSON.stringify({ success: true, message: "Project deleted successfully." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Admin Research Papers API ──
  if (url.pathname === "/api/admin/papers") {
    await ensureAdminSeedData();
    const col = await getCollection<Document>("papers");

    if (request.method === "GET") {
      const search = url.searchParams.get("search")?.toLowerCase().trim();
      const domain = url.searchParams.get("domain");

      const query: Record<string, any> = {};
      if (domain && domain !== "All") query.domain = domain;

      const docs = await col.find(query).sort({ createdAt: -1 }).toArray();

      let filtered = docs.map((p) => ({
        ...p,
        id: p._id.toString(),
        _id: p._id.toString(),
      }));

      if (search) {
        filtered = filtered.filter(
          (p: any) =>
            p.title?.toLowerCase().includes(search) ||
            p.authors?.toLowerCase().includes(search) ||
            p.uploaderEmail?.toLowerCase().includes(search)
        );
      }

      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "DELETE") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {}

      const id = url.searchParams.get("id") || body.id;
      if (!id) {
        return new Response(JSON.stringify({ error: "Paper ID is required." }), { status: 400 });
      }

      let filterId: any = id;
      if (ObjectId.isValid(id)) filterId = new ObjectId(id);

      await col.deleteOne({ $or: [{ _id: filterId }, { id }] });

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "PAPER_ACTION",
        `Deleted research paper (ID: ${id})`
      );

      return new Response(JSON.stringify({ success: true, message: "Paper deleted successfully." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Admin Announcements API ──
  if (url.pathname === "/api/admin/announcements") {
    await ensureAdminSeedData();
    const col = await getCollection<Document>("announcements");

    if (request.method === "GET") {
      const docs = await col.find().sort({ pinned: -1, createdAt: -1 }).toArray();
      const formatted = docs.map((a) => ({ ...a, id: a._id.toString(), _id: a._id.toString() }));
      return new Response(JSON.stringify(formatted), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400 });
      }

      const { title, content, targetAudience, priority, pinned, published } = body;

      if (!title || !content) {
        return new Response(JSON.stringify({ error: "Title and Content are required." }), { status: 400 });
      }

      const record: AnnouncementRecord = {
        title,
        content,
        targetAudience: targetAudience || "All",
        priority: priority || "Normal",
        pinned: Boolean(pinned),
        published: Boolean(published ?? true),
        authorName: "Enterprise Admin",
        authorEmail: "admin@scholarnexus.ai",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await col.insertOne(record as any);

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "ANNOUNCEMENT",
        `Created announcement: "${title}"`,
        `Target: ${targetAudience}, Priority: ${priority}`
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Announcement created.",
          announcement: { ...record, id: result.insertedId.toString() },
        }),
        { status: 201, headers: { "content-type": "application/json" } }
      );
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400 });
      }

      const { id, title, content, targetAudience, priority, pinned, published } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Announcement ID required." }), { status: 400 });
      }

      let filterId: any = id;
      if (ObjectId.isValid(id)) filterId = new ObjectId(id);

      const updateData: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
      if (priority !== undefined) updateData.priority = priority;
      if (pinned !== undefined) updateData.pinned = Boolean(pinned);
      if (published !== undefined) updateData.published = Boolean(published);

      await col.updateOne({ $or: [{ _id: filterId }, { id }] }, { $set: updateData });

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "ANNOUNCEMENT",
        `Updated announcement (ID: ${id})`
      );

      return new Response(JSON.stringify({ success: true, message: "Announcement updated." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "DELETE") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {}

      const id = url.searchParams.get("id") || body.id;
      if (!id) {
        return new Response(JSON.stringify({ error: "Announcement ID required." }), { status: 400 });
      }

      let filterId: any = id;
      if (ObjectId.isValid(id)) filterId = new ObjectId(id);

      await col.deleteOne({ $or: [{ _id: filterId }, { id }] });

      await logActivity(
        "Enterprise Admin",
        "admin@scholarnexus.ai",
        "admin",
        "ANNOUNCEMENT",
        `Deleted announcement (ID: ${id})`
      );

      return new Response(JSON.stringify({ success: true, message: "Announcement deleted." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Admin Activity Logs API ──
  if (url.pathname === "/api/admin/activity-logs") {
    await ensureAdminSeedData();
    const col = await getCollection<Document>("activity_logs");

    if (request.method === "GET") {
      const search = url.searchParams.get("search")?.toLowerCase().trim();
      const actionType = url.searchParams.get("actionType");

      const query: Record<string, any> = {};
      if (actionType && actionType !== "All") query.actionType = actionType;

      const docs = await col.find(query).sort({ timestamp: -1 }).limit(100).toArray();

      let filtered = docs.map((l) => ({
        ...l,
        id: l._id.toString(),
        _id: l._id.toString(),
      }));

      if (search) {
        filtered = filtered.filter(
          (l: any) =>
            l.description?.toLowerCase().includes(search) ||
            l.userName?.toLowerCase().includes(search) ||
            l.userEmail?.toLowerCase().includes(search) ||
            l.details?.toLowerCase().includes(search)
        );
      }

      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Admin Seed Trigger API ──
  if (url.pathname === "/api/admin/seed") {
    await ensureAdminSeedData();
    return new Response(
      JSON.stringify({ success: true, message: "Admin seed data initialized successfully." }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  if (url.pathname === "/api/projects") {
    const userEmail =
      url.searchParams.get("email") ||
      url.searchParams.get("userEmail") ||
      request.headers.get("x-user-email");

    if (request.method === "GET") {
      if (!userEmail) {
        return new Response(JSON.stringify({ error: "User email is required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      const search = url.searchParams.get("search") || undefined;
      const status = url.searchParams.get("status") || undefined;
      const projects = await findProjectsByUser(userEmail, search, status);
      return new Response(JSON.stringify(projects), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const email = (body.userEmail || body.email || userEmail)?.trim().toLowerCase();
      if (!email) {
        return new Response(JSON.stringify({ error: "User email is required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const validationError = validateProjectPayload(body);
      if (validationError) {
        return new Response(JSON.stringify({ error: validationError }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const now = new Date().toISOString();
      const newProject = {
        userEmail: email,
        title: body.title.trim(),
        description: (body.description || "").trim(),
        domain: body.domain.trim(),
        status: body.status,
        progress: Math.min(100, Math.max(0, Number(body.progress) || 0)),
        startDate: body.startDate,
        expectedCompletionDate: body.expectedCompletionDate,
        faculty: (body.faculty || "").trim(),
        createdAt: now,
        updatedAt: now,
      };

      const created = await createProject(newProject);
      return new Response(JSON.stringify(created), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const projectId = body.id || body._id || url.searchParams.get("id");
      const email = (body.userEmail || body.email || userEmail)?.trim().toLowerCase();

      if (!projectId || !email) {
        return new Response(JSON.stringify({ error: "Project ID and User Email are required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const validationError = validateProjectPayload(body);
      if (validationError) {
        return new Response(JSON.stringify({ error: validationError }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      try {
        const updated = await updateProject(projectId, email, body);
        if (!updated) {
          return new Response(JSON.stringify({ error: "Project not found." }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || "Failed to update project." }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (request.method === "DELETE") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        // empty body ok
      }

      const projectId = url.searchParams.get("id") || body.id || body._id;
      const email = (userEmail || body.userEmail || body.email)?.trim().toLowerCase();

      if (!projectId || !email) {
        return new Response(JSON.stringify({ error: "Project ID and User Email are required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      try {
        const success = await deleteProject(projectId, email);
        if (!success) {
          return new Response(JSON.stringify({ error: "Project not found or already deleted." }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: true, message: "Project deleted successfully." }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || "Failed to delete project." }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { "content-type": "application/json", Allow: "GET, POST, PUT, DELETE" },
    });
  }

  if (url.pathname === "/api/faculty-list") {
    if (request.method === "GET") {
      try {
        const usersCollection = await getCollection<UserRecord>("users");
        const facultyUsers = await usersCollection
          .find({ role: "faculty" })
          .project({ name: 1, email: 1, displayName: 1, affiliation: 1, photoURL: 1 })
          .toArray();

        const dbFacultyList = facultyUsers.map((f) => ({
          name: f.displayName || f.name,
          email: f.email,
          title: f.affiliation || "Faculty Advisor",
          department: "Academic Department",
        }));

        return new Response(JSON.stringify(dbFacultyList), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }
  }

  if (url.pathname === "/api/send-otp") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { "content-type": "application/json", Allow: "POST" },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const { email } = body as { email?: string };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address (e.g. name@university.edu)." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Check MongoDB database for ALL user types (student, faculty, instructor, admin)
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "This email address is not registered in ScholarNexus AI. Please check your email or create an account.",
        }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalizedEmail, { otp, expiresAt });

    await sendOtpEmail(normalizedEmail, otp);

    return new Response(
      JSON.stringify({
        success: true,
        message: "6-digit verification code has been sent to your email address.",
        role: user.role,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  if (url.pathname === "/api/verify-otp") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { "content-type": "application/json", Allow: "POST" },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const { email, otp } = body as { email?: string; otp?: string };
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and verification code are required." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code. Please check your email and try again." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Code verified successfully." }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  if (url.pathname === "/api/update-password" || url.pathname === "/api/reset-password") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { "content-type": "application/json", Allow: "POST" },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const { email, newPassword } = body as { email?: string; newPassword?: string };
    if (!email || !newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Email and new password (min 6 characters) are required." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const collection = await getCollection<UserRecord>("users");
    const hashedPassword = hashPassword(newPassword);

    const result = await collection.updateOne(
      {
        $or: [
          { email: normalizedEmail },
          { email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        ],
      },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Account not found for this email address." }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    otpStore.delete(normalizedEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully in database!" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  if (url.pathname === "/api/register") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { "content-type": "application/json", Allow: "POST" },
      });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Request body must be valid JSON." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Request body must be an object." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const { name, email, password, role } = body as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
    };

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid registration fields." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const normalizedRole = role.toLowerCase();
    if (normalizedRole !== "student" && normalizedRole !== "faculty") {
      return new Response(
        JSON.stringify({ error: "Only student and faculty roles are allowed for sign up." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: "An account with this email address already exists. Each email can only be registered once. Please sign in instead.",
        }),
        {
          status: 409,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const result = await registerUser({ name, email, password, role });
    return new Response(JSON.stringify({ userId: result.insertedId }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname === "/api/login") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { "content-type": "application/json", Allow: "POST" },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Request body must be valid JSON." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Request body must be an object." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const { email: loginEmail, password: loginPassword } = body as {
      email?: unknown;
      password?: unknown;
    };

    if (typeof loginEmail !== "string" || typeof loginPassword !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid login fields." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const user = await authenticateUser(loginEmail, loginPassword);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        email: user.email,
        role: user.role,
        name: user.name,
        profileCompleted: user.profileCompleted,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  if (url.pathname === "/api/oauth-login") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { "content-type": "application/json", Allow: "POST" },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Request body must be valid JSON." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Request body must be an object." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const { provider, providerId, email: oauthEmail, name, photoURL, role } = body as {
      provider?: unknown;
      providerId?: unknown;
      email?: unknown;
      name?: unknown;
      photoURL?: unknown;
      role?: unknown;
    };

    if (
      typeof provider !== "string" ||
      typeof providerId !== "string" ||
      typeof oauthEmail !== "string" ||
      typeof name !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid OAuth login payload." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const user = await findOrCreateOAuthUser(
      provider,
      providerId,
      oauthEmail,
      name,
      typeof photoURL === "string" ? photoURL : undefined,
      typeof role === "string" ? role : undefined,
    );

    return new Response(
      JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profileCompleted,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  if (url.pathname === "/api/profile") {
    if (request.method === "GET") {
      const emailParam = url.searchParams.get("email") ?? request.headers.get("x-user-email");
      if (!emailParam) {
        return new Response(JSON.stringify({ error: "User email parameter is required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      const user = await findUserByEmail(emailParam);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found." }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      const { password: _, ...profileData } = user;
      return new Response(JSON.stringify(profileData), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const email = (body.email || request.headers.get("x-user-email"))?.trim().toLowerCase();
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required to identify user profile." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const existingUser = await findUserByEmail(email);
      if (!existingUser) {
        return new Response(JSON.stringify({ error: "User profile not found." }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }

      const updateData: Record<string, any> = {
        updatedAt: new Date().toISOString(),
        profileCompleted: true,
      };

      if (typeof body.name === "string" || typeof body.displayName === "string") {
        const inputName = (body.name ?? body.displayName ?? "").trim();
        if (inputName.length < 3) {
          return new Response(
            JSON.stringify({ error: "Full Name must be at least 3 characters long." }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
        updateData.name = inputName;
        updateData.displayName = inputName;
      }

      if (typeof body.phone === "string") {
        const trimmedPhone = body.phone.trim();
        if (trimmedPhone.length > 0) {
          const digitsOnly = trimmedPhone.replace(/[^0-9]/g, "");
          const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
          if (!phoneRegex.test(trimmedPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
            return new Response(
              JSON.stringify({ error: "Please enter a valid phone number (7–15 digits)." }),
              { status: 400, headers: { "content-type": "application/json" } }
            );
          }
          updateData.phone = trimmedPhone;
        } else {
          updateData.phone = "";
        }
      }

      if (typeof body.affiliation === "string") {
        const trimmedAffiliation = body.affiliation.trim();
        if (trimmedAffiliation.length > 200) {
          return new Response(
            JSON.stringify({ error: "Institution/Affiliation must not exceed 200 characters." }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
        updateData.affiliation = trimmedAffiliation;
      }

      if (typeof body.bio === "string") {
        const trimmedBio = body.bio.trim();
        if (trimmedBio.length > 500) {
          return new Response(
            JSON.stringify({ error: "Short Bio must not exceed 500 characters." }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
        updateData.bio = trimmedBio;
      }

      if (typeof body.researchInterests === "string") {
        const trimmedInterests = body.researchInterests.trim();
        if (trimmedInterests.length > 500) {
          return new Response(
            JSON.stringify({ error: "Research interests must not exceed 500 characters." }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
        updateData.researchInterests = trimmedInterests;
      }

      if (typeof body.profileImage === "string") {
        updateData.profileImage = body.profileImage;
        updateData.photoURL = body.profileImage;
      } else if (typeof body.photoURL === "string") {
        updateData.photoURL = body.photoURL;
        updateData.profileImage = body.photoURL;
      }

      const collection = await getCollection<UserRecord>("users");
      const normalizedEmail = email.trim().toLowerCase();
      await collection.updateOne(
        {
          $or: [
            { email: normalizedEmail },
            { email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
          ],
        },
        { $set: updateData }
      );

      const updatedUser = await findUserByEmail(normalizedEmail);
      if (updatedUser) {
        const { password: _, ...profileData } = updatedUser;
        return new Response(
          JSON.stringify({ success: true, message: "Profile updated successfully.", user: profileData }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true, message: "Profile updated successfully." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: "Request body must be valid JSON." }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          },
        );
      }

      if (!body || typeof body !== "object") {
        return new Response(
          JSON.stringify({ error: "Request body must be an object." }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          },
        );
      }

      const { email: profileEmail, displayName, affiliation, bio } = body as {
        email?: unknown;
        displayName?: unknown;
        affiliation?: unknown;
        bio?: unknown;
      };

      if (
        typeof profileEmail !== "string" ||
        typeof displayName !== "string" ||
        typeof affiliation !== "string" ||
        typeof bio !== "string"
      ) {
        return new Response(
          JSON.stringify({ error: "Invalid profile data." }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          },
        );
      }

      await completeUserProfile(profileEmail, { displayName, affiliation, bio });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { "content-type": "application/json", Allow: "GET, PUT, POST" },
    });
  }

  if (url.pathname !== "/api/data") {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const collection = url.searchParams.get("collection");
  const dbName = url.searchParams.get("dbName") ?? "scholarnexus";

  if (!collection) {
    return new Response(
      JSON.stringify({ error: "Missing collection query parameter." }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  }

  if (request.method === "GET") {
    const documents = await findAllDocuments(collection, dbName);
    return new Response(JSON.stringify(documents), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (request.method === "POST") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Request body must be valid JSON." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Request body must be an object." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const result = await insertDocument(collection, body, dbName);
    return new Response(
      JSON.stringify({ insertedId: result.insertedId }),
      {
        status: 201,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed." }), {
    status: 405,
    headers: { "content-type": "application/json", Allow: "GET,POST" },
  });
}
