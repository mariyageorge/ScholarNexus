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
  name: string;
  email: string;
  password: string;
  role: string;
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
  updatedAt?: string;
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
  const record: UserRecord = {
    name: user.name,
    email: user.email.trim().toLowerCase(),
    password: hashPassword(user.password),
    role: user.role,
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

export async function handleApiRequest(request: Request, url: URL): Promise<Response> {
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
