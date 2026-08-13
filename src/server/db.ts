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
  status?: "Active" | "Pending" | "Suspended" | "Rejected" | "Deleted" | "Awaiting Applicant Response";
  createdAt: string;
  profileCompleted: boolean;
  displayName?: string;
  affiliation?: string;
  bio?: string;
  phone?: string;
  researchInterests?: string | string[];
  profileImage?: string;
  provider?: string;
  providerId?: string;
  photoURL?: string;
  department?: string;
  designation?: string;
  degree?: string;
  credentials?: string;
  assignedFaculty?: string;
  assignedStudents?: string[];
  approvalDate?: string;
  approvedBy?: string;
  approvalReason?: string;
  lastLogin?: string;
  deletedAt?: string;
  updatedAt?: string;

  /* Faculty Specific Fields */
  institution?: string;
  facultyId?: string;
  areasOfExpertise?: string | string[];
  orcid?: string;
  verificationDocument?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected" | "Info Requested";
  adminMessage?: string;
  requestedBy?: string;
  requestedDate?: string;
  rejectionDate?: string;
  applicationHistory?: { action: string; timestamp: string; details?: string; by?: string }[];
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
  abstract?: string;
  domain: string;
  status: "Planning" | "In Progress" | "Under Review" | "Completed" | "On Hold";
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  facultyId?: string | null;
  faculty?: string | null;
  requestedFacultyId?: string | null;
  requestedFacultyName?: string | null;
  supervisionStatus?: string;
  keywords?: string[];
  lastRejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/* ── OTP In-Memory Store ── */
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function recordUserActivity(
  email: string,
  userName: string,
  action: string,
  title: string,
  description: string,
  category: "Project" | "Paper" | "Task" | "Note" | "Profile" | "System" = "System"
) {
  try {
    const col = await getCollection<Document>("activity_logs");
    await col.insertOne({
      userEmail: email.trim().toLowerCase(),
      userName: userName || email.split("@")[0],
      action,
      title,
      description,
      category,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to record activity:", err);
  }
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
  user: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    institution?: string;
    department?: string;
    designation?: string;
    facultyId?: string;
    researchInterests?: string;
    areasOfExpertise?: string;
    orcid?: string;
    verificationDocument?: string;
  },
  dbName = "scholarnexus"
) {
  const isFaculty = user.role.toLowerCase() === "faculty";
  const status = isFaculty ? "Pending" : "Active";
  const approvalStatus: "Pending" | "Approved" = isFaculty ? "Pending" : "Approved";
  const record: UserRecord = {
    name: user.name,
    email: user.email.trim().toLowerCase(),
    password: hashPassword(user.password),
    role: user.role,
    status,
    approvalStatus,
    createdAt: new Date().toISOString(),
    profileCompleted: false,
    phone: user.phone || undefined,
    institution: user.institution || (user.department ? user.institution || "ScholarNexus Institute" : undefined),
    department: user.department || undefined,
    designation: user.designation || undefined,
    facultyId: user.facultyId || undefined,
    researchInterests: user.researchInterests || undefined,
    areasOfExpertise: user.areasOfExpertise || undefined,
    orcid: user.orcid || undefined,
    verificationDocument: user.verificationDocument || undefined,
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
      userEmail: userEmail || "scholarnexusadmin@gmail.com",
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

export async function purgeMockDataFromDb() {
  try {
    const mockEmails = [
      "athorne@university.edu",
      "erostova@stanford.edu",
      "mvance@oxford.ac.uk",
      "sophia.chen@student.edu",
      "liam.oc@student.edu",
      "mpatel@student.edu",
    ];

    // 1. Clear sample mock users
    const usersCol = await getCollection<UserRecord>("users");
    await usersCol.deleteMany({ email: { $in: mockEmails } });

    // 2. Clear sample mock papers (user has not uploaded any papers yet)
    const papersCol = await getCollection<Document>("papers");
    await papersCol.deleteMany({
      $or: [
        { uploaderEmail: { $in: mockEmails } },
        { title: { $regex: /Example|High-Throughput|Robustness Bounds/i } },
      ],
    });

    // 3. Clear sample mock projects
    const projectsCol = await getCollection<Document>("projects");
    await projectsCol.deleteMany({
      $or: [
        { userEmail: { $in: mockEmails } },
        { title: { $regex: /Neural Radiance Fields|Scalable Graph Transformers|Quantum Key Distribution/i } },
      ],
    });

    // 4. Clear sample mock announcements
    const announcementsCol = await getCollection<Document>("announcements");
    await announcementsCol.deleteMany({
      title: { $regex: /Fall 2026 Research Grant|Faculty Mentorship Portal Maintenance/i },
    });

    // 5. Clear sample mock activity logs
    const activityCol = await getCollection<Document>("activity_logs");
    await activityCol.deleteMany({
      $or: [
        { userEmail: { $in: mockEmails } },
        {
          description: {
            $regex:
              /Updated System Security & Session Policies|Reviewed Faculty Application for Prof. Elena Rostova|Created Research Project: Neural Radiance Fields/i,
          },
        },
      ],
    });
  } catch (err) {
    console.error("Error purging mock data:", err);
  }
}

export async function ensureAdminSeedData() {
  try {
    const usersCol = await getCollection<UserRecord>("users");
    const adminEmail = "scholarnexusadmin@gmail.com";

    // 1. Remove or demote all other admin accounts
    await usersCol.updateMany(
      { role: "admin", email: { $ne: adminEmail } },
      { $set: { role: "student" } }
    );
    await usersCol.deleteMany({ email: "admin@scholarnexus.ai" });

    // 2. Ensure scholarnexusadmin@gmail.com is present with admin role
    const existingAdmin = await usersCol.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await usersCol.insertOne({
        name: "ScholarNexus Admin",
        email: adminEmail,
        password: hashPassword("admin123"),
        role: "admin",
        status: "Active",
        createdAt: new Date().toISOString(),
        profileCompleted: true,
        displayName: "ScholarNexus System Administrator",
        affiliation: "ScholarNexus Central Administration",
        bio: "Lead System Administrator & Academic Research Coordinator.",
        department: "Central IT & Research Ops",
      });
    } else {
      await usersCol.updateOne(
        { email: adminEmail },
        {
          $set: {
            role: "admin",
            status: "Active",
            profileCompleted: true,
          },
        }
      );
    }

    // Automatically purge old mock data to ensure clean database state
    await purgeMockDataFromDb();
  } catch (err) {
    console.error("Error ensuring admin user exists:", err);
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

      // Real 6-Month Date Windows
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const last6Months: { month: string; year: number; monthIdx: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          month: monthNames[d.getMonth()],
          year: d.getFullYear(),
          monthIdx: d.getMonth(),
        });
      }

      const allUsers = await usersCol.find({}).toArray();
      const userGrowth = last6Months.map(({ month, year, monthIdx }) => {
        const students = allUsers.filter((u) => {
          if (u.role !== "student") return false;
          const cd = new Date(u.createdAt);
          return !isNaN(cd.getTime()) && cd.getFullYear() === year && cd.getMonth() === monthIdx;
        }).length;
        const faculty = allUsers.filter((u) => {
          if (u.role !== "faculty") return false;
          const cd = new Date(u.createdAt);
          return !isNaN(cd.getTime()) && cd.getFullYear() === year && cd.getMonth() === monthIdx;
        }).length;
        return { month, students, faculty };
      });

      // Real Project Status Counts
      const statusList = ["Planning", "In Progress", "Under Review", "Completed", "On Hold"];
      const projectStatus = await Promise.all(
        statusList.map(async (status) => ({
          name: status,
          value: await projectsCol.countDocuments({ status }),
        }))
      );

      // Real Research Domains Aggregation
      const domainAgg = await projectsCol
        .aggregate([
          { $group: { _id: "$domain", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ])
        .toArray();
      const researchDomains = domainAgg.map((d) => ({
        domain: d._id || "General",
        count: d.count,
      }));

      // Real Monthly Papers Uploads
      const allPapers = await papersCol.find({}).toArray();
      const monthlyPapers = last6Months.map(({ month, year, monthIdx }) => {
        const count = allPapers.filter((p) => {
          const cd = new Date(p.createdAt);
          return !isNaN(cd.getTime()) && cd.getFullYear() === year && cd.getMonth() === monthIdx;
        }).length;
        return { month, papers: count };
      });

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
      
      if (status && status !== "All") {
        query.status = status;
      }

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
            u.name?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search) ||
            (u.affiliation && u.affiliation.toLowerCase().includes(search)) ||
            (u.department && u.department.toLowerCase().includes(search))
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

      const { id, email, role, status, affiliation, bio, department, designation, phone, assignedFaculty } = body;
      const targetEmail = (email || body.userEmail)?.trim().toLowerCase();

      if (!targetEmail && !id) {
        return new Response(JSON.stringify({ error: "User identifier required." }), { status: 400 });
      }

      let filter: any = { email: targetEmail };
      if (id && ObjectId.isValid(id)) {
        filter = { $or: [{ _id: new ObjectId(id) }, { email: targetEmail }] };
      }

      const existingUser = await col.findOne(filter);
      if (!existingUser) {
        return new Response(JSON.stringify({ error: "User not found." }), { status: 404 });
      }

      // Security check: Admin cannot be suspended, rejected, or deleted
      if ((existingUser.role === "admin" || targetEmail === "scholarnexusadmin@gmail.com") && status && (status === "Suspended" || status === "Rejected" || status === "Deleted")) {
        return new Response(JSON.stringify({ error: "Administrator accounts cannot be suspended, rejected, or deleted." }), { status: 400 });
      }

      const updatePayload: Record<string, any> = { updatedAt: new Date().toISOString() };
      // Note: Name and Email are strictly READ-ONLY and excluded from updatePayload
      if (role && existingUser.role !== "admin") updatePayload.role = role.toLowerCase();
      if (status) updatePayload.status = status;
      if (affiliation !== undefined) updatePayload.affiliation = affiliation;
      if (bio !== undefined) updatePayload.bio = bio;
      if (department !== undefined) updatePayload.department = department;
      if (designation !== undefined) updatePayload.designation = designation;
      if (phone !== undefined) updatePayload.phone = phone;
      if (assignedFaculty !== undefined) updatePayload.assignedFaculty = assignedFaculty;

      await col.updateOne(filter, { $set: updatePayload });

      await logActivity(
        "Enterprise Admin",
        "scholarnexusadmin@gmail.com",
        "admin",
        "USER_MANAGEMENT",
        `Updated user account (${targetEmail})`,
        `Role: ${role ?? existingUser.role}, Status: ${status ?? existingUser.status}`
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

      const existingUser = await col.findOne(filter);
      if (!existingUser) {
        return new Response(JSON.stringify({ error: "User not found." }), { status: 404 });
      }

      if (existingUser.role === "admin" || email === "scholarnexusadmin@gmail.com") {
        return new Response(JSON.stringify({ error: "Administrator accounts cannot be deleted." }), { status: 400 });
      }

      // Perform Soft Delete
      await col.updateOne(filter, {
        $set: {
          status: "Deleted",
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      await logActivity(
        "Enterprise Admin",
        "scholarnexusadmin@gmail.com",
        "admin",
        "USER_MANAGEMENT",
        `Soft-deleted user account (${email || existingUser.email})`,
        "User account marked as Deleted/Inactive."
      );

      return new Response(JSON.stringify({ success: true, message: "User account deactivated (Soft Deleted)." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Admin User Details API ──
  if (url.pathname === "/api/admin/users/details") {
    await ensureAdminSeedData();
    const email = url.searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email param is required." }), { status: 400 });
    }

    const usersCol = await getCollection<UserRecord>("users");
    const projectsCol = await getCollection<Document>("projects");
    const papersCol = await getCollection<Document>("papers");
    const activityCol = await getCollection<Document>("activity_logs");

    const user = await usersCol.findOne({
      $or: [
        { email },
        { email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
      ],
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found." }), { status: 404 });
    }

    // Projects for user
    const userProjects = await projectsCol.find({
      $or: [{ userEmail: email }, { faculty: email }, { faculty: user.name }],
    }).toArray();

    const formattedProjects = userProjects.map((p) => ({
      ...p,
      id: p._id.toString(),
      _id: p._id.toString(),
    }));

    // Papers uploaded by user
    const userPapers = await papersCol.find({
      $or: [{ uploaderEmail: email }, { authors: { $regex: user.name, $options: "i" } }],
    }).toArray();

    const formattedPapers = userPapers.map((p) => ({
      ...p,
      id: p._id.toString(),
      _id: p._id.toString(),
    }));

    // User Activity Timeline
    const userActivities = await activityCol.find({
      $or: [{ userEmail: email }, { userName: user.name }],
    }).sort({ timestamp: -1 }).limit(20).toArray();

    const formattedActivities = userActivities.map((a) => ({
      ...a,
      id: a._id.toString(),
      _id: a._id.toString(),
    }));

    // Calculate academic counts
    const totalProjects = formattedProjects.length;
    const activeProjects = formattedProjects.filter((p: any) => p.status === "In Progress" || p.status === "Under Review" || p.status === "Planning").length;
    const papersUploaded = formattedPapers.length;

    return new Response(
      JSON.stringify({
        user: {
          ...user,
          id: user._id.toString(),
          _id: user._id.toString(),
        },
        academicInfo: {
          totalProjects,
          activeProjects,
          papersUploaded,
          assignedFaculty: user.assignedFaculty || "Prof. Dr. Harrison (CS Lead)",
          assignedStudents: user.assignedStudents || ["alex.chen@student.edu", "sarah.m@student.edu"],
        },
        researchSummary: {
          totalProjects,
          papersUploaded,
          tasksCompleted: Math.max(2, totalProjects * 3),
          notesCreated: Math.max(1, totalProjects * 2),
        },
        projects: formattedProjects,
        papers: formattedPapers,
        activityTimeline: formattedActivities,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // ── Faculty Dashboard API ──
  if (url.pathname === "/api/faculty/dashboard") {
    await ensureAdminSeedData();
    const email = url.searchParams.get("email")?.trim().toLowerCase();

    const usersCol = await getCollection<UserRecord>("users");
    const projectsCol = await getCollection<Document>("projects");
    const papersCol = await getCollection<Document>("papers");
    const supCol = await getCollection<Document>("supervision_requests");

    // Fetch user profile
    const facultyUser = email ? await usersCol.findOne({ email }) : null;
    const facultyName = facultyUser?.name || "Faculty Member";

    // 1. Supervised Students (Only approved supervised students)
    const approvedSupReqs = email
      ? await supCol.find({
          $or: [
            { facultyEmail: email },
            { facultyEmail: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
          ],
          status: "Approved",
        }).toArray()
      : [];

    const supervisedProjects = email
      ? await projectsCol.find({
          $or: [
            { facultyEmail: email },
            { facultyEmail: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
          ],
          supervisionStatus: "Under Supervision",
        }).toArray()
      : [];

    const approvedStudentEmails = new Set<string>([
      ...approvedSupReqs.map((r) => (r.studentEmail || r.email || "").toLowerCase()).filter(Boolean),
      ...supervisedProjects.map((p) => (p.userEmail || "").toLowerCase()).filter(Boolean),
    ]);

    const studentQuery: any = email
      ? {
          role: "student",
          status: { $ne: "Deleted" },
          $or: [
            { email: { $in: Array.from(approvedStudentEmails) } },
            { assignedFaculty: email },
          ],
        }
      : { role: "student", status: { $ne: "Deleted" } };

    const studentDocs = await usersCol.find(studentQuery).toArray();
    const totalStudents = studentDocs.length;

    // 2. Active Projects
    const projectDocs = await projectsCol.find({}).sort({ updatedAt: -1 }).toArray();
    const activeProjects = projectDocs.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      title: p.title || p.name || "Research Project",
      studentsCount: p.studentsCount || (p.members?.length) || 0,
      progress: p.progress ?? 0,
      status: p.status || "Active",
      domain: p.domain || p.category || "Research",
      leadStudent: p.userEmail || p.leadStudent || "",
      milestone: p.milestone || "",
      lastUpdated: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));

    // Clean up any old dummy seed requests
    await supCol.deleteMany({ email: { $in: ["alex.rivera@student.edu", "sophia.chen@student.edu", "david.kim@student.edu"] } });

    // 3. Supervision Requests
    const supDocs = await supCol.find({}).sort({ createdAt: -1 }).toArray();

    const requests = supDocs.map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      studentName: r.studentName,
      email: r.email,
      projectTitle: r.projectTitle || r.topic,
      topic: r.topic || r.projectTitle,
      domain: r.domain || "AI & ML",
      proposalSummary: r.proposalSummary || r.topic,
      submittedDate: r.submittedDate || r.submittedAt || new Date().toISOString().split("T")[0],
      submittedAt: r.submittedAt || r.submittedDate || new Date().toISOString().split("T")[0],
      status: r.status || "Pending",
      gpa: r.gpa || "N/A",
    }));

    // 4. Publications
    const paperDocs = await papersCol.find({}).toArray();
    const totalPapers = paperDocs.length;

    return new Response(
      JSON.stringify({
        stats: {
          myStudents: totalStudents,
          activeProjects: activeProjects.length,
          pendingReviews: requests.filter((r) => r.status === "Pending").length,
          publications: totalPapers,
        },
        requests,
        projects: activeProjects,
        students: studentDocs.map((s) => ({
          id: s._id.toString(),
          _id: s._id.toString(),
          name: s.name,
          email: s.email,
          department: s.department || "Computer Science",
          degreeProgram: (s as any).degreeProgram || s.affiliation || "Student Scholar",
          activeProject: (s as any).activeProject || "Academic Research Initiative",
          status: "Under Supervision",
          joinedDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        })),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // ── Student-Faculty Supervision Requests API ──
  if (url.pathname === "/api/supervision-requests" || url.pathname === "/api/faculty/supervision-requests") {
    await ensureAdminSeedData();
    const supCol = await getCollection<Document>("supervision_requests");
    const projectsCol = await getCollection<Document>("projects");
    const workCol = await getCollection<Document>("research_work");
    const notifCol = await getCollection<Document>("notifications");

    if (request.method === "GET") {
      const studentEmail = (url.searchParams.get("studentEmail") || url.searchParams.get("student"))?.trim().toLowerCase();
      const facultyEmail = (url.searchParams.get("facultyEmail") || url.searchParams.get("faculty") || request.headers.get("x-user-email"))?.trim().toLowerCase();
      const projectId = url.searchParams.get("projectId");
      const statusFilter = url.searchParams.get("status");

      const query: Record<string, any> = {};
      if (studentEmail) query.studentEmail = studentEmail;
      if (facultyEmail) {
        query.$or = [
          { facultyEmail },
          { facultyEmail: { $regex: `^${facultyEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        ];
      }
      if (projectId) query.projectId = String(projectId);
      if (statusFilter && statusFilter !== "All") {
        query.status = statusFilter;
      }

      const docs = await supCol.find(query).sort({ submittedAt: -1, createdAt: -1 }).toArray();

      // Retrieve matching projects & research work to extract dynamic Abstract & Methodology (source of truth)
      const projectIds = Array.from(new Set(docs.map((r) => String(r.projectId)).filter(Boolean)));
      let pObjectIds: any[] = [];
      try {
        pObjectIds = projectIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
      } catch {}

      const [projectDocs, workDocs] = await Promise.all([
        projectsCol.find({ $or: [{ _id: { $in: pObjectIds } }, { id: { $in: projectIds } }] }).toArray(),
        workCol.find({ $or: [{ projectId: { $in: projectIds } }, { projectId: { $in: pObjectIds } }] }).sort({ updatedAt: -1, createdAt: -1 }).toArray(),
      ]);

      const projectMap = new Map<string, any>();
      for (const p of projectDocs) {
        projectMap.set(p._id.toString(), p);
        if (p.id) projectMap.set(String(p.id), p);
      }

      const workMap = new Map<string, any>();
      for (const w of workDocs) {
        const pKey = String(w.projectId);
        if (!workMap.has(pKey)) {
          workMap.set(pKey, w);
        }
      }

      const formatted = docs.map((r) => {
        const pIdStr = String(r.projectId || "");
        const proj = projectMap.get(pIdStr);
        const workDoc = workMap.get(pIdStr);

        let hasResearchWork = false;
        let abstractText: string | null = null;
        let methodologyText: string | null = null;

        if (workDoc) {
          hasResearchWork = true;
          if (typeof workDoc.abstract === "string" && workDoc.abstract.trim()) {
            abstractText = workDoc.abstract.trim();
          } else if (Array.isArray(workDoc.sections)) {
            const absSec = workDoc.sections.find((s: any) => /abstract/i.test(s.title || ""));
            if (absSec && typeof absSec.content === "string" && absSec.content.trim()) {
              abstractText = absSec.content.trim();
            }
          }

          if (Array.isArray(workDoc.sections)) {
            const methSec = workDoc.sections.find((s: any) => /method/i.test(s.title || ""));
            if (methSec && typeof methSec.content === "string" && methSec.content.trim()) {
              methodologyText = methSec.content.trim();
            }
          }
        }

        return {
          id: r._id.toString(),
          _id: r._id.toString(),
          projectId: r.projectId,
          projectTitle: proj?.title || r.projectTitle || r.topic || "Research Project",
          domain: proj?.domain || r.domain || "Artificial Intelligence",
          studentName: r.studentName || "Student Scholar",
          studentEmail: r.studentEmail || r.email || "",
          email: r.email || r.studentEmail || "",
          facultyId: r.facultyId || "",
          facultyName: r.facultyName || "Faculty Supervisor",
          facultyEmail: r.facultyEmail || "",
          status: r.status || "Pending",
          facultyRemarks: r.facultyRemarks || "",
          submittedDate: r.submittedDate || r.submittedAt || new Date().toISOString().split("T")[0],
          submittedAt: r.submittedAt || r.createdAt || new Date().toISOString(),
          respondedAt: r.respondedAt || null,
          message: r.message || "",
          hasResearchWork,
          abstract: abstractText,
          methodology: methodologyText,
        };
      });

      return new Response(JSON.stringify(formatted), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "POST") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const { projectId, facultyEmail, facultyName, studentEmail, studentName, projectTitle, message } = body;
      if (!projectId || !facultyEmail || !studentEmail) {
        return new Response(JSON.stringify({ error: "Project ID, Faculty Email, and Student Email are required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const fEmailNorm = facultyEmail.trim().toLowerCase();
      const sEmailNorm = studentEmail.trim().toLowerCase();
      const now = new Date().toISOString();

      let pFilter: any = projectId;
      if (ObjectId.isValid(projectId)) {
        pFilter = { $or: [{ _id: new ObjectId(projectId) }, { id: String(projectId) }] };
      } else {
        pFilter = { id: String(projectId) };
      }
      const projectDoc = await projectsCol.findOne(pFilter);
      const pTitle = projectTitle || projectDoc?.title || "Research Project";

      // 1. Prevent multiple active Pending supervision requests for the same project
      const activePendingReq = await supCol.findOne({
        projectId: String(projectId),
        status: "Pending",
      });
      if (activePendingReq) {
        return new Response(
          JSON.stringify({ error: "An active pending supervision request already exists for this project." }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      // 2. Prevent request if already approved/supervised
      if (projectDoc && projectDoc.supervisionStatus === "Under Supervision" && (projectDoc.facultyId || projectDoc.facultyEmail)) {
        return new Response(
          JSON.stringify({ error: "This project already has an approved faculty supervisor." }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const newReq = {
        projectId: String(projectId),
        projectTitle: pTitle,
        studentEmail: sEmailNorm,
        email: sEmailNorm,
        studentName: studentName || "Student Scholar",
        facultyEmail: fEmailNorm,
        facultyName: facultyName || "Faculty Supervisor",
        message: message || "",
        status: "Pending",
        facultyRemarks: "",
        submittedAt: now,
        submittedDate: now.split("T")[0],
        createdAt: now,
        updatedAt: now,
      };

      const result = await supCol.insertOne(newReq as any);

      // Update project supervision status: NOT assigned faculty yet, pending request only!
      await projectsCol.updateOne(
        { $or: [{ _id: projectDoc?._id }, { id: String(projectId) }] },
        {
          $set: {
            supervisionStatus: "Pending Approval",
            requestedFacultyId: fEmailNorm,
            requestedFacultyName: facultyName || "Faculty Supervisor",
            facultyId: null,
            facultyEmail: null,
            faculty: null,
            updatedAt: now,
          },
        }
      );

      // Send Notification to Faculty: "New Supervision Request"
      await notifCol.insertOne({
        userEmail: fEmailNorm,
        recipientId: fEmailNorm,
        senderId: sEmailNorm,
        type: "SupervisionRequest",
        title: "New Supervision Request",
        content: `${studentName || "Student Scholar"} has requested you as a supervisor.`,
        category: "Supervision",
        read: false,
        createdAt: now,
        projectId: String(projectId),
        studentId: sEmailNorm,
        facultyId: fEmailNorm,
      });

      const created = { ...newReq, id: result.insertedId.toString(), _id: result.insertedId.toString() };
      return new Response(JSON.stringify(created), { status: 201, headers: { "content-type": "application/json" } });
    }

    if (request.method === "PUT") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const reqId = body.id || body._id;
      const status = body.status;
      const remarks = (body.facultyRemarks || "").trim();

      if (!reqId || !status) {
        return new Response(JSON.stringify({ error: "Request ID and Status are required." }), { status: 400 });
      }

      let rId: any = reqId;
      if (ObjectId.isValid(reqId)) rId = new ObjectId(reqId);
      const existingReq = await supCol.findOne({ $or: [{ _id: rId }, { id: String(reqId) }] });

      if (!existingReq) {
        return new Response(JSON.stringify({ error: "Supervision request not found." }), { status: 404 });
      }

      const now = new Date().toISOString();
      const newStatus = status === "Approved" ? "Approved" : "Rejected";

      await supCol.updateOne(
        { _id: existingReq._id },
        { $set: { status: newStatus, facultyRemarks: remarks, respondedAt: now, updatedAt: now } }
      );

      const sEmail = (existingReq.studentEmail || existingReq.email || "").toLowerCase();
      const fEmail = (existingReq.facultyEmail || "").toLowerCase();
      const fName = existingReq.facultyName || "Faculty Supervisor";
      const pTitle = existingReq.projectTitle || "Research Project";

      let pId: any = existingReq.projectId;
      if (ObjectId.isValid(existingReq.projectId)) pId = new ObjectId(existingReq.projectId);

      if (newStatus === "Approved") {
        // Sync project document to Under Supervision and assign faculty
        await projectsCol.updateOne(
          { $or: [{ _id: pId }, { id: String(existingReq.projectId) }] },
          {
            $set: {
              supervisionStatus: "Under Supervision",
              facultyId: fEmail,
              facultyEmail: fEmail,
              faculty: fName,
              updatedAt: now,
            },
          }
        );

        // Send Notification to Student: "Supervision Request Approved"
        if (sEmail) {
          await notifCol.insertOne({
            userEmail: sEmail,
            recipientId: sEmail,
            senderId: fEmail,
            type: "SupervisionApproved",
            title: "Supervision Request Approved",
            content: `${fName} has accepted your supervision request.`,
            category: "Supervision",
            read: false,
            createdAt: now,
            projectId: String(existingReq.projectId || ""),
            studentId: sEmail,
            facultyId: fEmail,
          });
        }
      } else {
        // Supervision Rejected: Clear assigned faculty!
        await projectsCol.updateOne(
          { $or: [{ _id: pId }, { id: String(existingReq.projectId) }] },
          {
            $set: {
              supervisionStatus: "Rejected",
              lastRejectionReason: remarks,
              facultyId: null,
              facultyEmail: null,
              faculty: null,
              updatedAt: now,
            },
          }
        );

        // Send Notification to Student: "Supervision Request Rejected"
        if (sEmail) {
          await notifCol.insertOne({
            userEmail: sEmail,
            recipientId: sEmail,
            senderId: fEmail,
            type: "SupervisionRejected",
            title: "Supervision Request Rejected",
            content: `${fName} rejected your supervision request.${remarks ? ' Reason: "' + remarks + '"' : ''}`,
            category: "Supervision",
            read: false,
            createdAt: now,
            projectId: String(existingReq.projectId || ""),
            studentId: sEmail,
            facultyId: fEmail,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, message: `Supervision request ${newStatus.toLowerCase()}.` }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Faculty Supervised Students & Workspace API ──
  if (url.pathname === "/api/faculty/students") {
    await ensureAdminSeedData();
    const facultyEmail = (url.searchParams.get("facultyEmail") || url.searchParams.get("email"))?.trim().toLowerCase();
    const studentId = url.searchParams.get("studentId");
    const targetProjectId = url.searchParams.get("projectId");

    if (!facultyEmail) {
      return new Response(JSON.stringify({ error: "Faculty email is required." }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const usersCol = await getCollection<UserRecord>("users");
    const projectsCol = await getCollection<Document>("projects");
    const papersCol = await getCollection<Document>("papers");
    const supCol = await getCollection<Document>("supervision_requests");
    const activityCol = await getCollection<Document>("activity_logs");
    const revCol = await getCollection<Document>("reviews");
    const workCol = await getCollection<Document>("research_work");

    if (studentId) {
      // TARGETED WORKSPACE: Strict project-level supervision scoping
      let sQuery: any = { role: "student", status: { $ne: "Deleted" } };
      if (ObjectId.isValid(studentId)) {
        sQuery.$or = [{ _id: new ObjectId(studentId) }, { id: studentId }, { email: studentId.toLowerCase() }];
      } else {
        sQuery.$or = [{ id: studentId }, { email: studentId.toLowerCase() }];
      }

      const targetUser = await usersCol.findOne(sQuery);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "Student not found." }), { status: 404, headers: { "content-type": "application/json" } });
      }

      const studentEmail = targetUser.email.toLowerCase();

      // Locate specific requested project or default to the faculty's approved project
      let projectDoc: any = null;
      if (targetProjectId) {
        let pFilterId: any = targetProjectId;
        if (ObjectId.isValid(targetProjectId)) pFilterId = new ObjectId(targetProjectId);
        projectDoc = await projectsCol.findOne({
          $or: [{ _id: pFilterId }, { id: String(targetProjectId) }]
        });
      } else {
        projectDoc = await projectsCol.findOne({
          userEmail: studentEmail,
          supervisionStatus: "Under Supervision",
          $or: [
            { facultyEmail: facultyEmail },
            { facultyId: facultyEmail },
            { facultyEmail: { $regex: `^${facultyEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }
          ]
        });
      }

      if (!projectDoc || projectDoc.userEmail?.toLowerCase() !== studentEmail) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Access denied. No valid project found for this student." }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      const pIdStr = projectDoc._id.toString();
      const pAltId = projectDoc.id ? String(projectDoc.id) : pIdStr;

      // BACKEND SECURITY CHECK: Verify approved supervision relationship for THIS project & THIS faculty
      const isFacultyAssigned =
        projectDoc.supervisionStatus === "Under Supervision" &&
        (projectDoc.facultyEmail?.toLowerCase() === facultyEmail ||
         projectDoc.facultyId?.toLowerCase() === facultyEmail ||
         (projectDoc.facultyEmail && new RegExp(`^${facultyEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i").test(projectDoc.facultyEmail)));

      const approvedSupReq = await supCol.findOne({
        projectId: { $in: [pIdStr, pAltId] },
        $or: [{ facultyEmail: facultyEmail }, { facultyEmail: { $regex: `^${facultyEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }],
        status: "Approved",
      });

      if (!isFacultyAssigned && !approvedSupReq) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: You do not have approved supervision access for this specific project." }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      // SCOPED DATA FETCHING strictly by projectId (pIdStr / pAltId)
      const [supReq, studentPapers, studentWorkDocs, paperReviews, projectActivities] = await Promise.all([
        supCol.findOne({
          projectId: { $in: [pIdStr, pAltId] },
          status: "Approved",
        }),
        papersCol.find({
          userEmail: studentEmail,
          $or: [{ projectId: pIdStr }, { projectId: pAltId }]
        }).sort({ uploadDate: -1, createdAt: -1 }).toArray(),
        workCol.find({
          studentEmail: studentEmail,
          $or: [{ projectId: pIdStr }, { projectId: pAltId }]
        }).sort({ updatedAt: -1, createdAt: -1 }).toArray(),
        revCol.find({
          $or: [{ projectId: pIdStr }, { projectId: pAltId }]
        }).toArray(),
        activityCol.find({
          userEmail: studentEmail,
          $or: [
            { projectId: pIdStr },
            { projectId: pAltId },
            { details: { $regex: pIdStr, $options: "i" } }
          ]
        }).sort({ timestamp: -1 }).limit(20).toArray(),
      ]);

      const targetStudent = {
        id: targetUser._id.toString(),
        _id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        department: targetUser.department || "Computer Science",
        degreeProgram: (targetUser as any).degreeProgram || targetUser.affiliation || "B.S. Computer Science",
        activeProject: projectDoc.title || supReq?.projectTitle || "Academic Research Project",
        projectId: pIdStr,
        status: "Under Supervision" as const,
        joinedDate: supReq?.respondedAt
          ? new Date(supReq.respondedAt).toISOString().split("T")[0]
          : targetUser.createdAt ? new Date(targetUser.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      };

      const formattedPapers = studentPapers.map((p) => {
        const paperIdStr = p._id.toString();
        const existingRev = paperReviews.find((r) => r.documentId === paperIdStr || r.documentId === p.id);
        return {
          id: paperIdStr,
          _id: paperIdStr,
          projectId: pIdStr,
          title: p.title || "Research Paper",
          uploadDate: p.uploadDate || (p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
          fileType: p.fileType || (p.fileData?.startsWith("data:application/pdf") ? "PDF Document" : p.url ? "External Link" : "Document"),
          url: p.url || "",
          fileData: p.fileData || "",
          authors: p.authors || "",
          summary: p.summary || "",
          reviewStatus: existingRev ? existingRev.status : "No Review Requested",
          reviewId: existingRev ? existingRev._id.toString() : undefined,
          feedback: existingRev ? existingRev.feedback : undefined,
        };
      });

      const formattedResearchWork = studentWorkDocs.map((w) => {
        const workIdStr = w._id.toString();
        const existingRev = paperReviews.find((r) => r.documentId === workIdStr || r.documentId === w.id);
        return {
          id: workIdStr,
          _id: workIdStr,
          projectId: pIdStr,
          studentEmail: w.studentEmail,
          title: w.title || "Research Paper",
          templateType: w.templateType || "Research Paper",
          abstract: w.abstract || "",
          keywords: w.keywords || [],
          sections: w.sections || [],
          reviewStatus: existingRev ? existingRev.status : (w.reviewStatus || "Draft"),
          reviewId: existingRev ? existingRev._id.toString() : undefined,
          feedback: existingRev ? existingRev.feedback : (w.feedback || undefined),
          lastSaved: w.lastSaved || w.updatedAt || new Date().toISOString(),
          createdAt: w.createdAt || new Date().toISOString(),
        };
      });

      const formattedActivities = projectActivities.map((a) => ({
        id: a._id.toString(),
        _id: a._id.toString(),
        action: a.action || a.actionType || "PROJECT_ACTIVITY",
        title: a.title || a.description || "Project update",
        description: a.description || a.details || "",
        timestamp: a.timestamp || new Date().toISOString(),
        userName: a.userName || targetStudent.name,
      }));

      const workspaceData = {
        student: targetStudent,
        project: {
          id: pIdStr,
          _id: pIdStr,
          title: projectDoc.title || "Supervised Research Project",
          description: projectDoc.description || "Supervised academic research initiative.",
          domain: projectDoc.domain || projectDoc.category || "Artificial Intelligence",
          keywords: projectDoc.keywords || [projectDoc.domain || "AI", "Research", "Supervision"],
          progress: projectDoc.progress ?? 35,
          status: projectDoc.status || "In Progress",
          supervisionStatus: projectDoc.supervisionStatus || "Under Supervision",
          startDate: projectDoc.startDate || (projectDoc.createdAt ? new Date(projectDoc.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
          expectedCompletionDate: projectDoc.expectedCompletionDate || projectDoc.targetDate || "2026-12-31",
          supervisionStartDate: supReq?.respondedAt ? new Date(supReq.respondedAt).toISOString().split("T")[0] : (projectDoc.createdAt ? new Date(projectDoc.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
        },
        referencePapers: formattedPapers,
        papers: formattedPapers,
        researchWork: formattedResearchWork,
        activities: formattedActivities,
      };

      return new Response(JSON.stringify(workspaceData), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // LIST PATH: Fetch approved supervision requests & student directory for faculty
    const approvedSupReqs = await supCol.find({
      $or: [
        { facultyEmail: facultyEmail },
        { facultyEmail: { $regex: `^${facultyEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }
      ],
      status: "Approved",
    }).toArray();

    const supervisedProjects = await projectsCol.find({
      $or: [
        { facultyEmail: facultyEmail },
        { facultyId: facultyEmail },
        { facultyEmail: { $regex: `^${facultyEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }
      ],
      supervisionStatus: "Under Supervision",
    }).toArray();

    const approvedProjectEntries: any[] = [];
    const seenProjectIds = new Set<string>();

    for (const proj of supervisedProjects) {
      const pIdStr = proj._id.toString();
      if (!seenProjectIds.has(pIdStr)) {
        seenProjectIds.add(pIdStr);
        approvedProjectEntries.push({
          studentEmail: (proj.userEmail || "").toLowerCase(),
          project: proj,
          supReq: approvedSupReqs.find((r) => String(r.projectId) === pIdStr || String(r.projectId) === proj.id),
        });
      }
    }

    for (const req of approvedSupReqs) {
      const pIdStr = String(req.projectId);
      if (pIdStr && !seenProjectIds.has(pIdStr)) {
        seenProjectIds.add(pIdStr);
        let pFilterId: any = pIdStr;
        if (ObjectId.isValid(pIdStr)) pFilterId = new ObjectId(pIdStr);
        const proj = await projectsCol.findOne({ $or: [{ _id: pFilterId }, { id: pIdStr }] });
        if (proj) {
          approvedProjectEntries.push({
            studentEmail: (proj.userEmail || req.studentEmail || "").toLowerCase(),
            project: proj,
            supReq: req,
          });
        }
      }
    }

    const studentEmails = Array.from(new Set(approvedProjectEntries.map((e) => e.studentEmail).filter(Boolean)));
    const studentUsers = await usersCol.find({ email: { $in: studentEmails } }).toArray();
    const studentUserMap = new Map<string, any>();
    for (const u of studentUsers) {
      studentUserMap.set(u.email.toLowerCase(), u);
    }

    const formattedStudents = await Promise.all(
      approvedProjectEntries.map(async (entry) => {
        const sUser = studentUserMap.get(entry.studentEmail);
        const pIdStr = entry.project._id.toString();
        const pAltId = entry.project.id ? String(entry.project.id) : pIdStr;

        const paperCount = await papersCol.countDocuments({
          userEmail: entry.studentEmail,
          $or: [{ projectId: pIdStr }, { projectId: pAltId }]
        });

        return {
          id: sUser ? sUser._id.toString() : entry.project._id.toString(),
          _id: sUser ? sUser._id.toString() : entry.project._id.toString(),
          name: sUser?.name || entry.supReq?.studentName || "Student Scholar",
          email: entry.studentEmail,
          department: sUser?.department || "Computer Science",
          degreeProgram: (sUser as any)?.degreeProgram || sUser?.affiliation || "B.S. Computer Science",
          activeProject: entry.project.title || entry.supReq?.projectTitle || "Academic Research Project",
          projectId: pIdStr,
          status: "Under Supervision" as const,
          joinedDate: entry.supReq?.respondedAt
            ? new Date(entry.supReq.respondedAt).toISOString().split("T")[0]
            : entry.project.createdAt ? new Date(entry.project.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          paperCount,
        };
      })
    );

    return new Response(JSON.stringify(formattedStudents), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // ── My Research Work Academic Writing API ──
  if (url.pathname === "/api/research-work") {
    await ensureAdminSeedData();
    const workCol = await getCollection<Document>("research_work");

    if (request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      const studentEmail = url.searchParams.get("studentEmail")?.trim().toLowerCase();
      const id = url.searchParams.get("id");

      const query: Record<string, any> = {};
      if (id) {
        let objId: any = id;
        if (ObjectId.isValid(id)) objId = new ObjectId(id);
        query.$or = [{ _id: objId }, { id: String(id) }];
      } else {
        if (projectId) query.projectId = String(projectId);
        if (studentEmail) query.studentEmail = studentEmail;
      }

      const docs = await workCol.find(query).sort({ updatedAt: -1, createdAt: -1 }).toArray();
      const formatted = docs.map((w) => ({
        id: w._id.toString(),
        _id: w._id.toString(),
        projectId: w.projectId,
        studentId: w.studentId || w.studentEmail,
        studentEmail: w.studentEmail,
        studentName: w.studentName || "Student Scholar",
        title: w.title || "Untitled Research Paper",
        templateType: w.templateType || "Research Paper",
        abstract: w.abstract || "",
        keywords: w.keywords || [],
        sections: w.sections || [],
        reviewStatus: w.reviewStatus || "Draft",
        feedback: w.feedback || "",
        lastSaved: w.lastSaved || w.updatedAt || new Date().toISOString(),
        createdAt: w.createdAt || new Date().toISOString(),
        updatedAt: w.updatedAt || new Date().toISOString(),
      }));

      if (id && formatted.length > 0) {
        return new Response(JSON.stringify(formatted[0]), { status: 200, headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify(formatted), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "POST") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const { projectId, studentEmail, studentName, title, templateType, abstract, keywords, sections } = body;
      if (!projectId || !studentEmail) {
        return new Response(JSON.stringify({ error: "Project ID and Student Email are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const tType = templateType || "Research Paper";
      let defaultSections = sections;

      if (!defaultSections || !Array.isArray(defaultSections) || defaultSections.length === 0) {
        if (tType === "Literature Review") {
          defaultSections = [
            { id: "sec-1", title: "1. Introduction & Background", content: "" },
            { id: "sec-2", title: "2. Theoretical Framework", content: "" },
            { id: "sec-3", title: "3. Methodological Analysis", content: "" },
            { id: "sec-4", title: "4. Comparative Synthesis", content: "" },
            { id: "sec-5", title: "5. Research Gaps & Future Directions", content: "" },
            { id: "sec-6", title: "References", content: "" },
          ];
        } else if (tType === "Research Proposal") {
          defaultSections = [
            { id: "sec-1", title: "1. Problem Statement & Motivation", content: "" },
            { id: "sec-2", title: "2. Research Objectives & Questions", content: "" },
            { id: "sec-3", title: "3. Preliminary Literature Review", content: "" },
            { id: "sec-4", title: "4. Proposed Methodology & Design", content: "" },
            { id: "sec-5", title: "5. Expected Outcomes & Timeline", content: "" },
            { id: "sec-6", title: "References", content: "" },
          ];
        } else if (tType === "Project Report") {
          defaultSections = [
            { id: "sec-1", title: "Executive Summary", content: "" },
            { id: "sec-2", title: "1. Introduction", content: "" },
            { id: "sec-3", title: "2. Project Architecture & Requirements", content: "" },
            { id: "sec-4", title: "3. Implementation Details & Results", content: "" },
            { id: "sec-5", title: "4. Evaluation & Recommendations", content: "" },
          ];
        } else if (tType === "Conference Paper") {
          defaultSections = [
            { id: "sec-1", title: "1. Introduction & Background", content: "" },
            { id: "sec-2", title: "2. Proposed System / Methodology", content: "" },
            { id: "sec-3", title: "3. Experimental Evaluation", content: "" },
            { id: "sec-4", title: "4. Conclusion & Future Work", content: "" },
            { id: "sec-5", title: "References", content: "" },
          ];
        } else {
          // Standard Research Paper / Blank Default
          defaultSections = [
            { id: "sec-1", title: "1. Introduction", content: "" },
            { id: "sec-2", title: "2. Literature Review", content: "" },
            { id: "sec-3", title: "3. Methodology", content: "" },
            { id: "sec-4", title: "4. Results & Expected Findings", content: "" },
            { id: "sec-5", title: "5. Discussion", content: "" },
            { id: "sec-6", title: "6. Conclusion", content: "" },
            { id: "sec-7", title: "References", content: "" },
          ];
        }
      }

      const now = new Date().toISOString();
      const docTitle = title?.trim() || `${tType} — ${new Date().toLocaleDateString()}`;

      const newDoc = {
        projectId: String(projectId),
        studentId: studentEmail.trim().toLowerCase(),
        studentEmail: studentEmail.trim().toLowerCase(),
        studentName: studentName || "Student Scholar",
        title: docTitle,
        templateType: tType,
        abstract: abstract || "",
        keywords: Array.isArray(keywords) ? keywords : ["Research", "Academic"],
        sections: defaultSections,
        reviewStatus: "Draft",
        feedback: "",
        lastSaved: now,
        createdAt: now,
        updatedAt: now,
      };

      const result = await workCol.insertOne(newDoc as any);

      await recordUserActivity(
        studentEmail,
        studentName || "Student Scholar",
        "CREATE_RESEARCH_WORK",
        `Created Research Document: "${docTitle}"`,
        `Template: ${tType}`,
        "Project"
      );

      const created = { ...newDoc, id: result.insertedId.toString(), _id: result.insertedId.toString() };
      return new Response(JSON.stringify(created), { status: 201, headers: { "content-type": "application/json" } });
    }

    if (request.method === "PUT") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const workId = body.id || body._id;
      if (!workId) {
        return new Response(JSON.stringify({ error: "Research Work ID is required for update." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = workId;
      if (ObjectId.isValid(workId)) objId = new ObjectId(workId);

      const existingDoc = await workCol.findOne({ $or: [{ _id: objId }, { id: String(workId) }] });
      if (!existingDoc) {
        return new Response(JSON.stringify({ error: "Research Work document not found." }), { status: 404, headers: { "content-type": "application/json" } });
      }

      const now = new Date().toISOString();
      const updateFields: Record<string, any> = {
        lastSaved: now,
        updatedAt: now,
      };

      if (body.title !== undefined) updateFields.title = String(body.title).trim();
      if (body.abstract !== undefined) updateFields.abstract = String(body.abstract);
      if (body.keywords !== undefined && Array.isArray(body.keywords)) updateFields.keywords = body.keywords;
      if (body.sections !== undefined && Array.isArray(body.sections)) updateFields.sections = body.sections;
      if (body.reviewStatus !== undefined) updateFields.reviewStatus = body.reviewStatus;
      if (body.feedback !== undefined) updateFields.feedback = body.feedback;

      await workCol.updateOne({ _id: existingDoc._id }, { $set: updateFields });

      const updatedDoc = await workCol.findOne({ _id: existingDoc._id });
      const formatted = updatedDoc ? { ...updatedDoc, id: updatedDoc._id.toString(), _id: updatedDoc._id.toString() } : null;

      return new Response(JSON.stringify(formatted || { success: true }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "DELETE") {
      const workId = url.searchParams.get("id");
      if (!workId) {
        return new Response(JSON.stringify({ error: "Research Work ID is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = workId;
      if (ObjectId.isValid(workId)) objId = new ObjectId(workId);

      await workCol.deleteOne({ $or: [{ _id: objId }, { id: String(workId) }] });
      return new Response(JSON.stringify({ success: true, message: "Research document deleted." }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  // ── AI Writing Assistance API Endpoint ──
  if (url.pathname === "/api/ai/writing-assist") {
    if (request.method === "POST") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const { action, content, sectionTitle, projectTitle, domain } = body;
      const inputContent = (content || "").trim();
      const sTitle = sectionTitle || "Research Section";
      const pTitle = projectTitle || "Academic Research Project";

      let suggestion = "";

      if (action === "generate_abstract") {
        suggestion = `This study investigates advanced methodologies in ${domain || "computer science & AI"}, focusing on ${pTitle}. We present a systematic framework to address current limitations in existing approaches. Empirical evaluations demonstrate significant improvements in scalability, precision, and performance over conventional benchmarks. The findings provide valuable insights for future academic research and practical deployment.`;
      } else if (action === "improve_writing" || action === "academic_tone") {
        if (!inputContent) {
          suggestion = `In this section, we critically examine the fundamental principles underpinning ${pTitle}. The methodology relies upon empirical validation and structured analytical frameworks to ensure reproducibility and rigor.`;
        } else {
          suggestion = inputContent
            .replace(/\bI think\b/gi, "It is posited that")
            .replace(/\ba lot of\b/gi, "substantial")
            .replace(/\bbig\b/gi, "significant")
            .replace(/\bgood\b/gi, "advantageous")
            .replace(/\bshow\b/gi, "demonstrate")
            .replace(/\bfind out\b/gi, "determine");
          if (!suggestion.endsWith(".")) suggestion += ".";
          suggestion += ` Furthermore, these observations align with theoretical predictions and establish a robust foundation for further empirical investigation.`;
        }
      } else if (action === "expand_section") {
        suggestion = `${inputContent ? inputContent + "\n\n" : ""}To elaborate further on ${sTitle}, it is crucial to recognize the operational constraints and mathematical properties governing system behavior. Specifically, comparative literature underscores the trade-offs between computational complexity and analytical precision. Incorporating robust evaluation metrics allows for a comprehensive assessment of experimental efficacy across variable operational parameters.`;
      } else if (action === "generate_outline") {
        suggestion = `• Overview of ${sTitle} in the context of ${pTitle}\n• Theoretical Foundations & Core Methodological Assumptions\n• Key Experimental Setup & Variables\n• Critical Comparative Analysis with Existing Benchmarks\n• Synthesis of Results & Limitations`;
      } else if (action === "suggest_questions") {
        suggestion = `1. What are the primary computational bottlenecks identified during experimental execution?\n2. How does the proposed model maintain accuracy when subjected to noisy data environments?\n3. What specific architectural modifications contribute to the observed efficiency gains?`;
      } else if (action === "summarize_notes") {
        suggestion = `Key Synthesis: The analyzed notes highlight critical operational dependencies in ${pTitle}. Methodological rigor is maintained through structured benchmarking, providing empirical validation for proposed hypotheses.`;
      } else {
        suggestion = `Enhanced academic draft for ${sTitle}: The proposed framework demonstrates rigorous empirical performance across key experimental benchmarks.`;
      }

      return new Response(JSON.stringify({ success: true, suggestion }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // ── Faculty Reviews & Academic Feedback API ──
  if (url.pathname === "/api/reviews" || url.pathname === "/api/faculty/reviews") {
    await ensureAdminSeedData();
    const revCol = await getCollection<Document>("reviews");
    const projectsCol = await getCollection<Document>("projects");
    const papersCol = await getCollection<Document>("papers");
    const notifCol = await getCollection<Document>("notifications");

    // GET Reviews
    if (request.method === "GET") {
      const facultyEmail = url.searchParams.get("facultyEmail")?.trim().toLowerCase();
      const studentEmail = url.searchParams.get("studentEmail")?.trim().toLowerCase();
      const projectId = url.searchParams.get("projectId");
      const documentId = url.searchParams.get("documentId");
      const status = url.searchParams.get("status");

      const query: Record<string, any> = {};
      if (facultyEmail) query.facultyEmail = facultyEmail;
      if (studentEmail) query.studentEmail = studentEmail;
      if (projectId) query.projectId = projectId;
      if (documentId) query.documentId = documentId;
      if (status && status !== "All") query.status = status;

      const docs = await revCol.find(query).sort({ requestedAt: -1, createdAt: -1 }).toArray();

      const reviews = docs.map((r) => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        projectId: r.projectId,
        projectTitle: r.projectTitle || "Research Project",
        studentId: r.studentId,
        studentName: r.studentName || "Student Scholar",
        studentEmail: r.studentEmail,
        facultyId: r.facultyId,
        facultyName: r.facultyName || "Faculty Supervisor",
        facultyEmail: r.facultyEmail,
        documentId: r.documentId,
        documentTitle: r.documentTitle || r.paperTitle || "Research Paper",
        fileType: r.fileType || "PDF Document",
        fileData: r.fileData || "",
        url: r.url || "",
        feedback: r.feedback || "",
        status: r.status || "Pending Review",
        requestedAt: r.requestedAt || r.createdAt || new Date().toISOString(),
        reviewedAt: r.reviewedAt || null,
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt || new Date().toISOString(),
      }));

      return new Response(JSON.stringify(reviews), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // POST New Review Request (Student Side)
    if (request.method === "POST") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const { projectId, documentId, paperTitle, documentTitle, studentEmail, studentName, fileType, fileData, url } = body;

      if (!projectId || !documentId || !studentEmail) {
        return new Response(JSON.stringify({ error: "Project ID, Document ID, and Student Email are required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      // Check Rule: Project must have an approved supervisor
      let pFilter: any = projectId;
      if (ObjectId.isValid(projectId)) {
        pFilter = { $or: [{ _id: new ObjectId(projectId) }, { _id: String(projectId) }, { id: String(projectId) }] };
      } else {
        pFilter = { $or: [{ _id: String(projectId) }, { id: String(projectId) }] };
      }

      const projectDoc = await projectsCol.findOne(pFilter);

      if (!projectDoc || (projectDoc.supervisionStatus !== "Under Supervision" && !projectDoc.facultyEmail)) {
        return new Response(
          JSON.stringify({ error: "Cannot request review: Do not allow review requests when the project has no approved supervisor." }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      // Check Rule: Prevent duplicate active review requests for the same document
      const activePending = await revCol.findOne({
        documentId: String(documentId),
        status: "Pending Review",
      });

      if (activePending) {
        return new Response(
          JSON.stringify({ error: "An active review request already exists for this document." }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const docTitleStr = paperTitle || documentTitle || "Research Document";
      const facultyEmailNorm = (projectDoc.facultyEmail || "").trim().toLowerCase();
      const facultyNameStr = projectDoc.faculty || "Faculty Supervisor";
      const now = new Date().toISOString();

      const newReview = {
        projectId: String(projectId),
        projectTitle: projectDoc.title || "Research Project",
        studentId: studentEmail.trim().toLowerCase(),
        studentName: studentName || "Student Scholar",
        studentEmail: studentEmail.trim().toLowerCase(),
        facultyId: projectDoc.facultyId || "",
        facultyName: facultyNameStr,
        facultyEmail: facultyEmailNorm,
        documentId: String(documentId),
        documentTitle: docTitleStr,
        fileType: fileType || "PDF Document",
        fileData: fileData || "",
        url: url || "",
        feedback: "",
        status: "Pending Review",
        requestedAt: now,
        reviewedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await revCol.insertOne(newReview as any);

      // Sync status with research_work document
      const workCol = await getCollection<Document>("research_work");
      let wId: any = documentId;
      if (ObjectId.isValid(documentId)) wId = new ObjectId(documentId);
      await workCol.updateOne(
        { $or: [{ _id: wId }, { id: String(documentId) }] },
        { $set: { reviewStatus: "Pending Review", updatedAt: now } }
      );

      // Record Activity
      await recordUserActivity(
        studentEmail,
        studentName || "Student Scholar",
        "REVIEW_REQUESTED",
        `Review requested for paper "${docTitleStr}"`,
        `Submitted for faculty review to Dr. ${facultyNameStr}`,
        "Paper"
      );

      // Send Notification to Faculty
      if (facultyEmailNorm) {
        await notifCol.insertOne({
          userEmail: facultyEmailNorm,
          recipientId: facultyEmailNorm,
          senderId: (studentEmail || "").trim().toLowerCase(),
          type: "ReviewRequested",
          title: "Research Work Review Requested",
          content: `${studentName || "Student"} has requested a review of their research work for "${projectDoc.title || docTitleStr}".`,
          category: "Review",
          read: false,
          createdAt: now,
          projectId: String(projectId),
          studentId: (studentEmail || "").trim().toLowerCase(),
          facultyId: facultyEmailNorm,
          researchWorkId: String(documentId),
          reviewId: String(result.insertedId),
        });
      }

      const created = { ...newReview, id: result.insertedId.toString(), _id: result.insertedId.toString() };
      return new Response(JSON.stringify(created), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }

    // PUT Submit Feedback (Faculty Side)
    if (request.method === "PUT") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const reviewId = body.id || body._id || body.reviewId;
      const documentId = body.documentId || body.workId;
      const projectId = body.projectId;
      const feedbackText = (body.feedback || "").trim();

      if (!feedbackText) {
        return new Response(JSON.stringify({ error: "Feedback text is required." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const now = new Date().toISOString();
      const workCol = await getCollection<Document>("research_work");
      let existingReview: any = null;

      if (reviewId) {
        let rId: any = reviewId;
        if (ObjectId.isValid(reviewId)) rId = new ObjectId(reviewId);
        existingReview = await revCol.findOne({ $or: [{ _id: rId }, { id: String(reviewId) }] });
      }

      if (!existingReview && documentId) {
        existingReview = await revCol.findOne({ documentId: String(documentId) });
      }

      if (existingReview) {
        // Update existing review document
        const updatePayload = {
          feedback: feedbackText,
          status: "Reviewed",
          reviewedAt: now,
          updatedAt: now,
        };
        await revCol.updateOne({ _id: existingReview._id }, { $set: updatePayload });

        // Sync with research_work collection
        let wId: any = existingReview.documentId;
        if (ObjectId.isValid(existingReview.documentId)) wId = new ObjectId(existingReview.documentId);
        await workCol.updateOne(
          { $or: [{ _id: wId }, { id: String(existingReview.documentId) }] },
          { $set: { reviewStatus: "Reviewed", feedback: feedbackText, updatedAt: now } }
        );

        // Record activity & notification
        await recordUserActivity(
          existingReview.studentEmail || "student@scholarnexus.edu",
          existingReview.studentName || "Student Scholar",
          "FACULTY_FEEDBACK_SUBMITTED",
          `Faculty feedback submitted for "${existingReview.documentTitle}"`,
          `Feedback: "${feedbackText}"`,
          "Paper"
        );

        if (existingReview.studentEmail) {
          await notifCol.insertOne({
            userEmail: existingReview.studentEmail.toLowerCase(),
            recipientId: existingReview.studentEmail.toLowerCase(),
            senderId: (existingReview.facultyEmail || "").toLowerCase(),
            type: "FeedbackReceived",
            title: "Faculty feedback received",
            content: `${existingReview.facultyName || "Faculty"} has provided feedback on your research work for "${existingReview.projectTitle || existingReview.documentTitle}".`,
            category: "Review",
            read: false,
            createdAt: now,
            projectId: String(existingReview.projectId),
            studentId: existingReview.studentEmail.toLowerCase(),
            facultyId: (existingReview.facultyEmail || "").toLowerCase(),
            researchWorkId: String(existingReview.documentId),
            reviewId: String(existingReview._id),
          });
        }

        return new Response(JSON.stringify({ success: true, message: "Feedback submitted successfully." }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      } else if (documentId) {
        // Resolve Research Work document & Project details to insert new review record
        let wId: any = documentId;
        if (ObjectId.isValid(documentId)) wId = new ObjectId(documentId);
        const workDoc = await workCol.findOne({ $or: [{ _id: wId }, { id: String(documentId) }] });

        const studentEmailStr = (body.studentEmail || workDoc?.studentEmail || "student@scholarnexus.edu").toLowerCase();
        const studentNameStr = body.studentName || workDoc?.studentName || "Student Scholar";
        const docTitleStr = body.documentTitle || workDoc?.title || "Research Document";
        const projIdStr = projectId || workDoc?.projectId || "";

        const newReview = {
          projectId: String(projIdStr),
          projectTitle: body.projectTitle || "Research Project",
          studentId: studentEmailStr,
          studentName: studentNameStr,
          studentEmail: studentEmailStr,
          facultyId: body.facultyId || "",
          facultyName: body.facultyName || "Faculty Supervisor",
          facultyEmail: (body.facultyEmail || "").toLowerCase(),
          documentId: String(documentId),
          documentTitle: docTitleStr,
          fileType: workDoc?.templateType ? `${workDoc.templateType} Document` : "Research Document",
          feedback: feedbackText,
          status: "Reviewed",
          requestedAt: now,
          reviewedAt: now,
          createdAt: now,
          updatedAt: now,
        };

        const revResult = await revCol.insertOne(newReview as any);
        await workCol.updateOne(
          { $or: [{ _id: wId }, { id: String(documentId) }] },
          { $set: { reviewStatus: "Reviewed", feedback: feedbackText, updatedAt: now } }
        );

        await recordUserActivity(
          studentEmailStr,
          studentNameStr,
          "FACULTY_FEEDBACK_SUBMITTED",
          `Faculty feedback submitted for "${docTitleStr}"`,
          `Feedback: "${feedbackText}"`,
          "Paper"
        );

        await notifCol.insertOne({
          userEmail: studentEmailStr,
          recipientId: studentEmailStr,
          senderId: (body.facultyEmail || "").toLowerCase(),
          type: "FeedbackReceived",
          title: "Faculty feedback received",
          content: `${body.facultyName || "Faculty"} has provided feedback on your research work for "${body.projectTitle || docTitleStr}".`,
          category: "Review",
          read: false,
          createdAt: now,
          projectId: String(projIdStr),
          studentId: studentEmailStr,
          facultyId: (body.facultyEmail || "").toLowerCase(),
          researchWorkId: String(documentId),
          reviewId: String(revResult.insertedId),
        });

        return new Response(JSON.stringify({ success: true, message: "Feedback submitted successfully." }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Review or Document context not found." }), {
        status: 400,
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
      let body: any = {};
      try { body = await request.json(); } catch {}
      const { id, email, action, reason } = body;
      let filter: any = {};
      if (email) filter = { email: email.toLowerCase().trim() };
      else if (id && ObjectId.isValid(id)) filter = { _id: new ObjectId(id) };

      if (action === "approve") {
        await col.updateOne(filter, {
          $set: { status: "Active", approvalStatus: "Approved", updatedAt: new Date().toISOString() },
          $unset: { adminMessage: "", infoRequestMessage: "" }
        });
      } else if (action === "reject") {
        await col.updateOne(filter, {
          $set: { status: "Rejected", approvalStatus: "Rejected", rejectionReason: reason || "Verification criteria not met.", updatedAt: new Date().toISOString() },
          $unset: { adminMessage: "", infoRequestMessage: "" }
        });
      } else if (action === "request_info") {
        await col.updateOne(filter, {
          $set: { status: "Awaiting Applicant Response", approvalStatus: "Info Requested", adminMessage: reason, infoRequestMessage: reason, updatedAt: new Date().toISOString() }
        });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "content-type": "application/json" } });
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
          "scholarnexusadmin@gmail.com",
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
        "scholarnexusadmin@gmail.com",
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
        "scholarnexusadmin@gmail.com",
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

  // ── Notifications System API ──
  if (url.pathname === "/api/notifications") {
    await ensureAdminSeedData();
    const notifCol = await getCollection<Document>("notifications");

    if (request.method === "GET") {
      const email = (url.searchParams.get("email") || url.searchParams.get("userEmail"))?.trim().toLowerCase();
      if (!email) {
        return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
      }

      const docs = await notifCol
        .find({
          $or: [
            { userEmail: email },
            { recipientId: email },
            { recipientEmail: email },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = docs.map((n) => ({
        id: n._id.toString(),
        _id: n._id.toString(),
        recipientId: n.recipientId || n.userEmail,
        senderId: n.senderId || "",
        type: n.type || "System",
        title: n.title || "Notification",
        content: n.content || n.message || "",
        message: n.content || n.message || "",
        category: n.category || "System",
        read: Boolean(n.read),
        createdAt: n.createdAt || new Date().toISOString(),
        timestamp: n.timestamp || n.createdAt || new Date().toISOString(),
        projectId: n.projectId,
        studentId: n.studentId,
        facultyId: n.facultyId,
        researchWorkId: n.researchWorkId || n.documentId,
        reviewId: n.reviewId,
      }));

      return new Response(JSON.stringify(formatted), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "PUT") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const email = (body.email || body.userEmail || url.searchParams.get("email"))?.trim().toLowerCase();
      const notifId = body.id || body._id;
      const markAllRead = Boolean(body.markAllRead);

      if (markAllRead && email) {
        await notifCol.updateMany(
          { $or: [{ userEmail: email }, { recipientId: email }] },
          { $set: { read: true } }
        );
        return new Response(JSON.stringify({ success: true, message: "All notifications marked as read." }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (notifId) {
        let filterId: any = notifId;
        if (ObjectId.isValid(notifId)) filterId = new ObjectId(notifId);
        await notifCol.updateOne({ $or: [{ _id: filterId }, { id: String(notifId) }] }, { $set: { read: true } });
        return new Response(JSON.stringify({ success: true, message: "Notification marked as read." }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Notification ID or markAllRead flag required." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "DELETE") {
      let body: any = {};
      try { body = await request.json(); } catch {}

      const email = (body.email || body.userEmail || url.searchParams.get("email"))?.trim().toLowerCase();
      const notifId = url.searchParams.get("id") || body.id || body._id;
      const clearAll = Boolean(body.clearAll);

      if (clearAll && email) {
        await notifCol.deleteMany({ $or: [{ userEmail: email }, { recipientId: email }] });
        return new Response(JSON.stringify({ success: true, message: "All notifications cleared." }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (notifId) {
        let filterId: any = notifId;
        if (ObjectId.isValid(notifId)) filterId = new ObjectId(notifId);
        await notifCol.deleteOne({ $or: [{ _id: filterId }, { id: String(notifId) }] });
        return new Response(JSON.stringify({ success: true, message: "Notification deleted." }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Notification ID or clearAll flag required." }), {
        status: 400,
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
        authorEmail: "scholarnexusadmin@gmail.com",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await col.insertOne(record as any);

      await logActivity(
        "Enterprise Admin",
        "scholarnexusadmin@gmail.com",
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
        "scholarnexusadmin@gmail.com",
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
        "scholarnexusadmin@gmail.com",
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

  // ── Admin Purge Mock Data API ──
  if (url.pathname === "/api/admin/purge-mock-data" || url.pathname === "/api/admin/seed") {
    await purgeMockDataFromDb();
    await ensureAdminSeedData();
    return new Response(
      JSON.stringify({ success: true, message: "Mock data purged and database cleaned successfully." }),
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
        description: (body.description || body.abstract || "").trim(),
        abstract: (body.abstract || body.description || "").trim(),
        domain: body.domain.trim(),
        status: body.status || "Planning",
        progress: Math.min(100, Math.max(0, Number(body.progress) || 0)),
        startDate: body.startDate,
        expectedCompletionDate: body.expectedCompletionDate,
        keywords: Array.isArray(body.keywords)
          ? body.keywords
          : typeof body.keywords === "string" && body.keywords
          ? body.keywords.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        facultyId: null,
        faculty: null,
        supervisionStatus: "Not Assigned",
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

  // ── User Settings API ──
  if (url.pathname === "/api/user/settings") {
    const email = url.searchParams.get("email") || request.headers.get("x-user-email");

    if (request.method === "GET") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email parameter is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }
      const user = await findUserByEmail(email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found." }), { status: 404, headers: { "content-type": "application/json" } });
      }
      const { password, ...safeUser } = user as any;
      return new Response(JSON.stringify(safeUser), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const targetEmail = (body.email || email)?.trim().toLowerCase();
      if (!targetEmail) {
        return new Response(JSON.stringify({ error: "User email is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const col = await getCollection<UserRecord>("users");
      const existing = await findUserByEmail(targetEmail);
      if (!existing) {
        return new Response(JSON.stringify({ error: "User not found." }), { status: 404, headers: { "content-type": "application/json" } });
      }

      const updateFields: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      if (body.displayName !== undefined) updateFields.displayName = body.displayName.trim();
      if (body.name !== undefined && body.name.trim()) updateFields.name = body.name.trim();
      if (body.affiliation !== undefined) updateFields.affiliation = body.affiliation.trim();
      if (body.bio !== undefined) updateFields.bio = body.bio.trim();
      if (body.phone !== undefined) updateFields.phone = body.phone.trim();
      if (body.researchInterests !== undefined) updateFields.researchInterests = body.researchInterests.trim();
      if (body.profileImage !== undefined) updateFields.profileImage = body.profileImage;

      await col.updateOne({ email: targetEmail }, { $set: updateFields });
      const updatedUser = await findUserByEmail(targetEmail);

      await recordUserActivity(targetEmail, updatedUser?.displayName || updatedUser?.name || "User", "PROFILE_UPDATED", "Profile Information Updated", "Updated personal bio and research information", "Profile");

      const { password, ...safeUpdated } = updatedUser as any;
      return new Response(JSON.stringify(safeUpdated), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  // ── Change Password API ──
  if (url.pathname === "/api/user/password") {
    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const { email, currentPassword, newPassword } = body;
      if (!email || !currentPassword || !newPassword) {
        return new Response(JSON.stringify({ error: "Email, current password, and new password are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      if (newPassword.length < 8) {
        return new Response(JSON.stringify({ error: "New password must be at least 8 characters long." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found." }), { status: 404, headers: { "content-type": "application/json" } });
      }

      const hashedCurrent = hashPassword(currentPassword);
      if (user.password !== hashedCurrent) {
        return new Response(JSON.stringify({ error: "Incorrect current password. Please try again." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const hashedNew = hashPassword(newPassword);
      const col = await getCollection<UserRecord>("users");
      await col.updateOne({ email: user.email }, { $set: { password: hashedNew, updatedAt: new Date().toISOString() } });

      await recordUserActivity(user.email, user.displayName || user.name, "SECURITY_UPDATED", "Password Changed", "Updated account password successfully", "System");

      return new Response(JSON.stringify({ success: true, message: "Password updated successfully." }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  // ── Preferences & Privacy API ──
  if (url.pathname === "/api/user/preferences") {
    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const { email, preferences } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "User email is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const col = await getCollection<UserRecord>("users");
      await col.updateOne({ email: email.trim().toLowerCase() }, { $set: { preferences, updatedAt: new Date().toISOString() } });

      return new Response(JSON.stringify({ success: true, message: "Preferences updated." }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  // ── Tasks API ──
  if (url.pathname === "/api/tasks") {
    const userEmail = url.searchParams.get("email") || request.headers.get("x-user-email");
    const tasksCol = await getCollection<Document>("tasks");

    if (request.method === "GET") {
      if (!userEmail) {
        return new Response(JSON.stringify({ error: "User email is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const query: Record<string, any> = { userEmail: userEmail.trim().toLowerCase() };
      const statusFilter = url.searchParams.get("status");
      const priorityFilter = url.searchParams.get("priority");
      const projectIdFilter = url.searchParams.get("projectId");

      if (statusFilter && statusFilter !== "All") query.status = statusFilter;
      if (priorityFilter && priorityFilter !== "All") query.priority = priorityFilter;
      if (projectIdFilter && projectIdFilter !== "All") query.projectId = projectIdFilter;

      const tasks = await tasksCol.find(query).sort({ dueDate: 1, createdAt: -1 }).toArray();
      const formatted = tasks.map((t) => ({ ...t, id: t._id.toString(), _id: t._id.toString() }));

      return new Response(JSON.stringify(formatted), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const email = (body.userEmail || userEmail)?.trim().toLowerCase();
      if (!email || !body.title?.trim()) {
        return new Response(JSON.stringify({ error: "User email and Task Title are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const now = new Date().toISOString();
      const newTask = {
        userEmail: email,
        title: body.title.trim(),
        description: (body.description || "").trim(),
        priority: body.priority || "Medium",
        status: body.status || "To Do",
        dueDate: body.dueDate || new Date().toISOString().split("T")[0],
        projectId: body.projectId || "",
        projectTitle: body.projectTitle || "",
        createdAt: now,
        updatedAt: now,
      };

      const result = await tasksCol.insertOne(newTask);
      const createdTask = { ...newTask, id: result.insertedId.toString(), _id: result.insertedId.toString() };

      await recordUserActivity(email, "Researcher", "TASK_CREATED", `Task Created: "${body.title.trim()}"`, `Priority: ${body.priority || "Medium"} • Due: ${body.dueDate}`, "Task");

      return new Response(JSON.stringify(createdTask), { status: 201, headers: { "content-type": "application/json" } });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const taskId = body.id || body._id;
      const email = (body.userEmail || userEmail)?.trim().toLowerCase();

      if (!taskId || !email) {
        return new Response(JSON.stringify({ error: "Task ID and email are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = taskId;
      if (ObjectId.isValid(taskId)) {
        objId = new ObjectId(taskId);
      }

      const now = new Date().toISOString();
      const updateData: Record<string, any> = { updatedAt: now };
      if (body.title) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description.trim();
      if (body.priority) updateData.priority = body.priority;
      if (body.status) updateData.status = body.status;
      if (body.dueDate) updateData.dueDate = body.dueDate;
      if (body.projectId !== undefined) updateData.projectId = body.projectId;
      if (body.projectTitle !== undefined) updateData.projectTitle = body.projectTitle;

      await tasksCol.updateOne({ $or: [{ _id: objId }, { id: taskId }], userEmail: email }, { $set: updateData });
      const updated = await tasksCol.findOne({ $or: [{ _id: objId }, { id: taskId }] });

      if (body.status === "Completed") {
        await recordUserActivity(email, "Researcher", "TASK_COMPLETED", `Task Completed: "${updated?.title || body.title}"`, `Marked as completed`, "Task");
      }

      const formatted = updated ? { ...updated, id: updated._id.toString(), _id: updated._id.toString() } : null;
      return new Response(JSON.stringify(formatted), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "DELETE") {
      const taskId = url.searchParams.get("id");
      const email = (userEmail || url.searchParams.get("email"))?.trim().toLowerCase();

      if (!taskId || !email) {
        return new Response(JSON.stringify({ error: "Task ID and email are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = taskId;
      if (ObjectId.isValid(taskId)) {
        objId = new ObjectId(taskId);
      }

      await tasksCol.deleteOne({ $or: [{ _id: objId }, { id: taskId }], userEmail: email });
      return new Response(JSON.stringify({ success: true, message: "Task deleted." }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  // ── Notes API ──
  if (url.pathname === "/api/notes") {
    const userEmail = url.searchParams.get("email") || request.headers.get("x-user-email");
    const notesCol = await getCollection<Document>("notes");

    if (request.method === "GET") {
      if (!userEmail) {
        return new Response(JSON.stringify({ error: "User email is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const query: Record<string, any> = { userEmail: userEmail.trim().toLowerCase() };
      const categoryFilter = url.searchParams.get("category");
      const projectIdFilter = url.searchParams.get("projectId");
      const archivedFilter = url.searchParams.get("archived");

      if (categoryFilter && categoryFilter !== "All") query.category = categoryFilter;
      if (projectIdFilter && projectIdFilter !== "All") query.projectId = projectIdFilter;
      if (archivedFilter !== null && archivedFilter !== undefined) query.archived = archivedFilter === "true";

      const notes = await notesCol.find(query).sort({ pinned: -1, updatedAt: -1 }).toArray();
      const formatted = notes.map((n) => ({ ...n, id: n._id.toString(), _id: n._id.toString() }));

      return new Response(JSON.stringify(formatted), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const email = (body.userEmail || userEmail)?.trim().toLowerCase();
      if (!email || !body.title?.trim()) {
        return new Response(JSON.stringify({ error: "User email and Note Title are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const now = new Date().toISOString();
      const newNote = {
        userEmail: email,
        title: body.title.trim(),
        content: (body.content || "").trim(),
        category: body.category || "General",
        pinned: Boolean(body.pinned),
        archived: Boolean(body.archived),
        tags: Array.isArray(body.tags) ? body.tags : [],
        projectId: body.projectId || "",
        projectTitle: body.projectTitle || "",
        createdAt: now,
        updatedAt: now,
      };

      const result = await notesCol.insertOne(newNote);
      const createdNote = { ...newNote, id: result.insertedId.toString(), _id: result.insertedId.toString() };

      await recordUserActivity(email, "Researcher", "NOTE_CREATED", `Note Authored: "${body.title.trim()}"`, `Category: ${body.category || "General"}`, "Note");

      return new Response(JSON.stringify(createdNote), { status: 201, headers: { "content-type": "application/json" } });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const noteId = body.id || body._id;
      const email = (body.userEmail || userEmail)?.trim().toLowerCase();

      if (!noteId || !email) {
        return new Response(JSON.stringify({ error: "Note ID and email are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = noteId;
      if (ObjectId.isValid(noteId)) {
        objId = new ObjectId(noteId);
      }

      const now = new Date().toISOString();
      const updateData: Record<string, any> = { updatedAt: now };
      if (body.title) updateData.title = body.title.trim();
      if (body.content !== undefined) updateData.content = body.content.trim();
      if (body.category) updateData.category = body.category;
      if (body.pinned !== undefined) updateData.pinned = Boolean(body.pinned);
      if (body.archived !== undefined) updateData.archived = Boolean(body.archived);
      if (body.tags !== undefined) updateData.tags = body.tags;
      if (body.projectId !== undefined) updateData.projectId = body.projectId;
      if (body.projectTitle !== undefined) updateData.projectTitle = body.projectTitle;

      await notesCol.updateOne({ $or: [{ _id: objId }, { id: noteId }], userEmail: email }, { $set: updateData });
      const updated = await notesCol.findOne({ $or: [{ _id: objId }, { id: noteId }] });

      const formatted = updated ? { ...updated, id: updated._id.toString(), _id: updated._id.toString() } : null;
      return new Response(JSON.stringify(formatted), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "DELETE") {
      const noteId = url.searchParams.get("id");
      const email = (userEmail || url.searchParams.get("email"))?.trim().toLowerCase();

      if (!noteId || !email) {
        return new Response(JSON.stringify({ error: "Note ID and email are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = noteId;
      if (ObjectId.isValid(noteId)) {
        objId = new ObjectId(noteId);
      }

      await notesCol.deleteOne({ $or: [{ _id: objId }, { id: noteId }], userEmail: email });
      return new Response(JSON.stringify({ success: true, message: "Note deleted." }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  // ── Activity Timeline API ──
  if (url.pathname === "/api/activity") {
    const userEmail = url.searchParams.get("email") || request.headers.get("x-user-email");
    const activityCol = await getCollection<Document>("activity_logs");

    if (request.method === "GET") {
      if (!userEmail) {
        return new Response(JSON.stringify({ error: "User email is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const query: Record<string, any> = { userEmail: userEmail.trim().toLowerCase() };
      const categoryFilter = url.searchParams.get("category");
      if (categoryFilter && categoryFilter !== "All") query.category = categoryFilter;

      const logs = await activityCol.find(query).sort({ timestamp: -1 }).limit(50).toArray();
      const formatted = logs.map((l) => ({ ...l, id: l._id.toString(), _id: l._id.toString() }));

      return new Response(JSON.stringify(formatted), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  // ── Calendar Events API ──
  if (url.pathname === "/api/calendar/events") {
    const userEmail = url.searchParams.get("email") || request.headers.get("x-user-email");
    const calendarCol = await getCollection<Document>("calendar_events");
    const projectsCol = await getCollection<Document>("projects");
    const tasksCol = await getCollection<Document>("tasks");

    if (request.method === "GET") {
      if (!userEmail) {
        return new Response(JSON.stringify({ error: "User email is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const normalizedEmail = userEmail.trim().toLowerCase();

      // Gather Custom Reminders
      const customEvents = await calendarCol.find({ userEmail: normalizedEmail }).toArray();
      const formattedCustom = customEvents.map((e) => ({
        id: e._id.toString(),
        _id: e._id.toString(),
        title: e.title,
        description: e.description || "",
        date: e.date,
        time: e.time || "",
        type: e.type || "Reminder",
        source: "custom",
      }));

      // Gather Projects Start & Target Completion Dates
      const userProjects = await projectsCol.find({ userEmail: normalizedEmail }).toArray();
      const projectEvents: any[] = [];
      userProjects.forEach((p) => {
        if (p.startDate) {
          projectEvents.push({
            id: `proj-start-${p._id}`,
            title: `Project Start: ${p.title}`,
            description: `Domain: ${p.domain} • Status: ${p.status}`,
            date: p.startDate,
            time: "09:00",
            type: "Milestone",
            source: "project",
            projectId: p._id.toString(),
          });
        }
        if (p.expectedCompletionDate) {
          projectEvents.push({
            id: `proj-due-${p._id}`,
            title: `Target Deadline: ${p.title}`,
            description: `Expected project completion deadline. Progress: ${p.progress}%`,
            date: p.expectedCompletionDate,
            time: "17:00",
            type: "Deadline",
            source: "project",
            projectId: p._id.toString(),
          });
        }
      });

      // Gather Tasks Due Dates
      const userTasks = await tasksCol.find({ userEmail: normalizedEmail }).toArray();
      const taskEvents: any[] = userTasks
        .filter((t) => t.dueDate)
        .map((t) => ({
          id: `task-due-${t._id}`,
          title: `Task Due: ${t.title}`,
          description: `Priority: ${t.priority} • Status: ${t.status}`,
          date: t.dueDate,
          time: "12:00",
          type: "Deadline",
          source: "task",
          priority: t.priority,
          status: t.status,
        }));

      const allEvents = [...formattedCustom, ...projectEvents, ...taskEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return new Response(JSON.stringify(allEvents), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const email = (body.userEmail || userEmail)?.trim().toLowerCase();
      if (!email || !body.title?.trim() || !body.date) {
        return new Response(JSON.stringify({ error: "User email, Title, and Date are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const newEvent = {
        userEmail: email,
        title: body.title.trim(),
        description: (body.description || "").trim(),
        date: body.date,
        time: body.time || "10:00",
        type: body.type || "Reminder",
        createdAt: new Date().toISOString(),
      };

      const result = await calendarCol.insertOne(newEvent);
      const created = { ...newEvent, id: result.insertedId.toString(), _id: result.insertedId.toString(), source: "custom" };

      await recordUserActivity(email, "Researcher", "CALENDAR_REMINDER_ADDED", `Reminder Set: "${body.title.trim()}"`, `Date: ${body.date}`, "System");

      return new Response(JSON.stringify(created), { status: 201, headers: { "content-type": "application/json" } });
    }

    if (request.method === "DELETE") {
      const eventId = url.searchParams.get("id");
      const email = (userEmail || url.searchParams.get("email"))?.trim().toLowerCase();

      if (!eventId || !email) {
        return new Response(JSON.stringify({ error: "Event ID and email are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = eventId;
      if (ObjectId.isValid(eventId)) {
        objId = new ObjectId(eventId);
      }

      await calendarCol.deleteOne({ $or: [{ _id: objId }, { id: eventId }], userEmail: email });
      return new Response(JSON.stringify({ success: true, message: "Calendar reminder deleted." }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }
  // ── Research Papers MongoDB API ──
  if (url.pathname === "/api/papers") {
    const papersCol = await getCollection<Document>("papers");

    if (request.method === "GET") {
      const projectIdParam = url.searchParams.get("projectId");
      const userEmail = url.searchParams.get("email") || request.headers.get("x-user-email");

      const query: Record<string, any> = {};
      if (projectIdParam) query.projectId = projectIdParam;
      if (userEmail) query.userEmail = userEmail.trim().toLowerCase();

      const docs = await papersCol.find(query).sort({ uploadDate: -1 }).toArray();
      const formatted = docs.map((p) => ({ ...p, id: p._id.toString(), _id: p._id.toString() }));
      return new Response(JSON.stringify(formatted), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      if (!body || typeof body !== "object") {
        return new Response(JSON.stringify({ error: "Body must be an object." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const { projectId, title, authors, year, journal, url: paperUrl, fileData, summary, userEmail } = body;
      if (!projectId || !title) {
        return new Response(JSON.stringify({ error: "Project ID and Title are required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const paperRecord = {
        projectId: String(projectId),
        title: String(title).trim(),
        authors: authors ? String(authors).trim() : "",
        year: year ? String(year).trim() : "",
        journal: journal ? String(journal).trim() : "",
        uploadDate: new Date().toISOString().split("T")[0],
        url: paperUrl ? String(paperUrl).trim() : "",
        fileData: fileData ? String(fileData) : undefined,
        summary: summary ? String(summary) : `Research paper "${title}" uploaded to project.`,
        userEmail: userEmail ? String(userEmail).trim().toLowerCase() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await papersCol.insertOne(paperRecord);
      const inserted = { ...paperRecord, id: result.insertedId.toString(), _id: result.insertedId.toString() };

      return new Response(JSON.stringify(inserted), { status: 201, headers: { "content-type": "application/json" } });
    }

    if (request.method === "PUT") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      if (!body || typeof body !== "object") {
        return new Response(JSON.stringify({ error: "Body must be an object." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      const paperId = body.id || body._id;
      if (!paperId) {
        return new Response(JSON.stringify({ error: "Paper ID is required for update." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = paperId;
      if (ObjectId.isValid(paperId)) {
        objId = new ObjectId(paperId);
      }

      const updateFields: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.title !== undefined) updateFields.title = String(body.title).trim();
      if (body.authors !== undefined) updateFields.authors = String(body.authors).trim();
      if (body.year !== undefined) updateFields.year = String(body.year).trim();
      if (body.journal !== undefined) updateFields.journal = String(body.journal).trim();
      if (body.url !== undefined) updateFields.url = String(body.url).trim();
      if (body.fileData !== undefined) updateFields.fileData = body.fileData;
      if (body.summary !== undefined) updateFields.summary = String(body.summary).trim();

      await papersCol.updateOne(
        { $or: [{ _id: objId }, { id: String(paperId) }] },
        { $set: updateFields }
      );

      const updatedDoc = await papersCol.findOne({ $or: [{ _id: objId }, { id: String(paperId) }] });
      const formatted = updatedDoc ? { ...updatedDoc, id: updatedDoc._id.toString(), _id: updatedDoc._id.toString() } : null;

      return new Response(JSON.stringify(formatted || { success: true }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (request.method === "DELETE") {
      const paperId = url.searchParams.get("id");
      if (!paperId) {
        return new Response(JSON.stringify({ error: "Paper ID required." }), { status: 400, headers: { "content-type": "application/json" } });
      }

      let objId: any = paperId;
      if (ObjectId.isValid(paperId)) {
        objId = new ObjectId(paperId);
      }

      await papersCol.deleteOne({ $or: [{ _id: objId }, { id: paperId }] });
      return new Response(JSON.stringify({ success: true, message: "Paper deleted successfully." }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }

  if (url.pathname === "/api/faculty-list") {
    if (request.method === "GET") {
      try {
        const usersCollection = await getCollection<UserRecord>("users");
        let facultyUsers = await usersCollection
          .find({
            role: "faculty",
            status: "Active",
          })
          .toArray();

        // Seed approved faculty members if none currently exist in DB
        if (facultyUsers.length === 0) {
          const defaultFaculty = [
            {
              name: "Dr. Aris Thorne",
              displayName: "Dr. Aris Thorne",
              email: "aris.thorne@university.edu",
              password: hashPassword("faculty123"),
              role: "faculty",
              status: "Active",
              affiliation: "Massachusetts Institute of Technology",
              institution: "Massachusetts Institute of Technology",
              designation: "Professor & Lab Director",
              department: "School of Computer Science & AI",
              researchInterests: ["Artificial Intelligence", "Machine Learning", "Neural Networks", "Robotics"],
              bio: "Professor of Computer Science specializing in Deep Learning and Intelligent Systems.",
              photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
              profileCompleted: true,
              createdAt: new Date().toISOString(),
            },
            {
              name: "Dr. Elena Rostova",
              displayName: "Dr. Elena Rostova",
              email: "elena.rostova@university.edu",
              password: hashPassword("faculty123"),
              role: "faculty",
              status: "Active",
              affiliation: "Stanford University",
              institution: "Stanford University",
              designation: "Associate Professor",
              department: "Department of Data Science & Analytics",
              researchInterests: ["Data Science & Analytics", "Big Data", "Predictive Modeling", "NLP"],
              bio: "Associate Professor focusing on Large-scale Data Analytics and Natural Language Processing.",
              photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
              profileCompleted: true,
              createdAt: new Date().toISOString(),
            },
            {
              name: "Dr. Marcus Vance",
              displayName: "Dr. Marcus Vance",
              email: "marcus.vance@university.edu",
              password: hashPassword("faculty123"),
              role: "faculty",
              status: "Active",
              affiliation: "Carnegie Mellon University",
              institution: "Carnegie Mellon University",
              designation: "Head of Department",
              department: "Cybersecurity & Distributed Systems",
              researchInterests: ["Cybersecurity & Privacy", "Cryptography", "Network Security", "Cloud Computing"],
              bio: "Head of Cybersecurity Division with extensive research in zero-trust architectures.",
              photoURL: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250",
              profileCompleted: true,
              createdAt: new Date().toISOString(),
            },
            {
              name: "Dr. Sophia Chen",
              displayName: "Dr. Sophia Chen",
              email: "sophia.chen@university.edu",
              password: hashPassword("faculty123"),
              role: "faculty",
              status: "Active",
              affiliation: "Harvard University",
              institution: "Harvard University",
              designation: "Professor",
              department: "Bioengineering & Neural Systems",
              researchInterests: ["Biomedical Engineering", "Neuroscience & Cognitive Science", "Bio-AI", "Medical Imaging"],
              bio: "Professor in Computational Neuroscience and Brain-Computer Interfaces.",
              photoURL: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250",
              profileCompleted: true,
              createdAt: new Date().toISOString(),
            },
          ];

          await usersCollection.insertMany(defaultFaculty as any);
          facultyUsers = await usersCollection
            .find({
              role: "faculty",
              status: "Active",
            })
            .toArray();
        }

        const dbFacultyList = facultyUsers.map((f: any) => ({
          id: f._id.toString(),
          _id: f._id.toString(),
          name: f.displayName || f.name || "Faculty Advisor",
          email: f.email,
          designation: f.designation || f.title || f.affiliation || "Professor & Academic Advisor",
          title: f.designation || f.title || f.affiliation || "Professor & Academic Advisor",
          department: f.department || "School of Computer Science & AI",
          institution: f.institution || f.affiliation || "University Research Institute",
          affiliation: f.institution || f.affiliation || "University Research Institute",
          researchInterests: Array.isArray(f.researchInterests)
            ? f.researchInterests
            : typeof f.researchInterests === "string" && f.researchInterests
            ? f.researchInterests.split(",").map((s: string) => s.trim()).filter(Boolean)
            : ["Artificial Intelligence", "Academic Research", "Machine Learning"],
          bio: f.bio || "",
          photoURL: f.photoURL || f.profileImage || "",
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

    const reqData = body as Record<string, any>;
    const name = String(reqData.name || "");
    const email = String(reqData.email || "");
    const password = String(reqData.password || "");
    const role = String(reqData.role || "");

    if (!name || !email || !password || !role) {
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

    const result = await registerUser({
      name,
      email,
      password,
      role,
      phone: reqData.phone,
      institution: reqData.institution,
      department: reqData.department,
      designation: reqData.designation,
      facultyId: reqData.facultyId,
      researchInterests: reqData.researchInterests,
      areasOfExpertise: reqData.areasOfExpertise,
      orcid: reqData.orcid,
      verificationDocument: reqData.verificationDocument,
    });

    return new Response(JSON.stringify({ userId: result.insertedId, role }), {
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

    if (user.status === "Suspended") {
      return new Response(
        JSON.stringify({ error: "Your account has been suspended by an administrator." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    if (user.status === "Rejected" || user.approvalStatus === "Rejected") {
      return new Response(
        JSON.stringify({ error: "Your faculty registration application has been rejected by system administration." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    if (user.status === "Deleted") {
      return new Response(
        JSON.stringify({ error: "This user account has been deactivated or deleted." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        email: user.email,
        role: user.role,
        name: user.name,
        profileCompleted: user.profileCompleted,
        status: user.status || "Active",
        approvalStatus: user.approvalStatus || (user.status === "Pending" ? "Pending" : String(user.status) === "Rejected" ? "Rejected" : "Approved"),
        institution: user.institution || user.affiliation,
        department: user.department,
        designation: user.designation,
        facultyId: user.facultyId,
        phone: user.phone,
        researchInterests: user.researchInterests,
        areasOfExpertise: user.areasOfExpertise,
        orcid: user.orcid,
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

  if (url.pathname === "/api/admin/faculty/approval") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers: { "content-type": "application/json" } });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const { id, email, action, reason, remarks, infoMessage } = body as {
      id?: string;
      email?: string;
      action?: string;
      reason?: string;
      remarks?: string;
      infoMessage?: string;
    };

    if (!id && !email) {
      return new Response(JSON.stringify({ error: "User ID or Email is required." }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const usersCol = await getCollection<UserRecord>("users");
    const filterQuery: any = {};
    if (id && ObjectId.isValid(id)) {
      filterQuery._id = new ObjectId(id);
    } else if (id) {
      filterQuery.id = id;
    } else if (email) {
      filterQuery.email = email.trim().toLowerCase();
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    let historyAction = "";
    let historyDetails = "";

    if (action === "approve") {
      updatePayload.approvalStatus = "Approved";
      updatePayload.status = "Active";
      updatePayload.approvalDate = new Date().toISOString();
      updatePayload.approvedBy = "scholarnexusadmin@gmail.com";
      if (remarks?.trim()) updatePayload.approvalReason = remarks.trim();
      historyAction = "Approved";
      historyDetails = remarks?.trim() || "Faculty registration application approved by system administration.";
    } else if (action === "reject") {
      const rejReason = (reason || remarks || "").trim();
      if (!rejReason) {
        return new Response(JSON.stringify({ error: "Rejection reason is mandatory." }), { status: 400, headers: { "content-type": "application/json" } });
      }
      updatePayload.approvalStatus = "Rejected";
      updatePayload.status = "Rejected";
      updatePayload.rejectionReason = rejReason;
      updatePayload.approvalReason = rejReason;
      updatePayload.rejectionDate = new Date().toISOString();
      historyAction = "Rejected";
      historyDetails = rejReason;
    } else if (action === "request_info" || action === "request_more_info") {
      const msg = (infoMessage || reason || remarks || "").trim();
      if (!msg) {
        return new Response(JSON.stringify({ error: "Clarification or document request message is required." }), { status: 400, headers: { "content-type": "application/json" } });
      }
      updatePayload.approvalStatus = "Info Requested";
      updatePayload.status = "Awaiting Applicant Response";
      updatePayload.infoRequestMessage = msg;
      updatePayload.adminMessage = msg;
      updatePayload.requestedBy = "scholarnexusadmin@gmail.com";
      updatePayload.requestedDate = new Date().toISOString();
      historyAction = "Additional Information Requested";
      historyDetails = msg;
    } else {
      return new Response(JSON.stringify({ error: "Invalid approval action." }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const historyItem = {
      action: historyAction,
      timestamp: new Date().toISOString(),
      details: historyDetails,
      by: "scholarnexusadmin@gmail.com",
    };

    await usersCol.updateOne(filterQuery, {
      $set: updatePayload,
      $push: { applicationHistory: historyItem },
    });

    await recordUserActivity(
      email || "scholarnexusadmin@gmail.com",
      "System Administrator",
      `FACULTY_${action.toUpperCase()}`,
      `Faculty Action: ${action}`,
      `Faculty record ${email || id} set to ${updatePayload.approvalStatus}.`,
      "Profile"
    );

    return new Response(JSON.stringify({ success: true, message: `Faculty application ${updatePayload.approvalStatus} successfully.` }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
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

      if (typeof body.verificationDocument === "string") {
        updateData.verificationDocument = body.verificationDocument;
      }
      if (typeof body.status === "string") {
        updateData.status = body.status;
      }
      if (typeof body.approvalStatus === "string") {
        updateData.approvalStatus = body.approvalStatus;
      }
      if (typeof body.infoResponse === "string") {
        updateData.infoResponse = body.infoResponse;
      }
      if (typeof body.institution === "string") {
        updateData.institution = body.institution.trim();
      }
      if (typeof body.department === "string") {
        updateData.department = body.department.trim();
      }
      if (typeof body.designation === "string") {
        updateData.designation = body.designation.trim();
      }
      if (typeof body.facultyId === "string") {
        updateData.facultyId = body.facultyId.trim();
      }
      if (typeof body.areasOfExpertise === "string" || Array.isArray(body.areasOfExpertise)) {
        updateData.areasOfExpertise = body.areasOfExpertise;
      }
      if (typeof body.orcid === "string") {
        updateData.orcid = body.orcid.trim();
      }

      const collection = await getCollection<UserRecord>("users");
      const normalizedEmail = email.trim().toLowerCase();

      const mongoUpdate: Record<string, any> = { $set: updateData };
      if (body.infoResponse || body.status === "Pending") {
        const historyItem = {
          action: "Applicant Responded",
          timestamp: new Date().toISOString(),
          details: (typeof body.infoResponse === "string" && body.infoResponse.trim()) ? body.infoResponse.trim() : "Applicant updated registration profile details & verification proof.",
          by: normalizedEmail,
        };
        mongoUpdate.$push = { applicationHistory: historyItem };
      }

      await collection.updateOne(
        {
          $or: [
            { email: normalizedEmail },
            { email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
          ],
        },
        mongoUpdate
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
