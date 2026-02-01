const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const COOKIE_NAME = "ri_token";

function requireAuth(req) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

function issueAuthCookie(res, user) {
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
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

function clearAuthCookie(res) {
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

module.exports = { requireAuth, issueAuthCookie, clearAuthCookie };
