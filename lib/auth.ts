import jwt from "jsonwebtoken";
import cookie from "cookie";

const COOKIE_NAME = "ri_token";

export function requireAuth(req: any): { id: string; role: string } | null {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export function issueAuthCookie(res: any, user: { id: string; role: string }) {
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: "7d"
  });

  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    })
  );
}

export function clearAuthCookie(res: any) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    })
  );
}
