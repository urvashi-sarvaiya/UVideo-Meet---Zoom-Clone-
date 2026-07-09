import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt, { hash } from "bcrypt";

import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
const login = async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername =
    typeof username === "string" ? username.trim() : username;
  const normalizedPassword =
    typeof password === "string" ? password.trim() : password;

  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: "Please Provide" });
  }

  try {
    const user = await User.findOne({ username: normalizedUsername });

    console.log("Username received during login:", normalizedUsername);
    console.log("Password received during login:", normalizedPassword);
    console.log("User from DB:", user);

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User Not Found",
      });
    }

    let isPasswordCorrect = await bcrypt.compare(
      normalizedPassword,
      user.password,
    );

    console.log("Stored hash:", user.password);
    console.log("Result of bcrypt.compare():", isPasswordCorrect);

    if (isPasswordCorrect) {
      let token = crypto.randomBytes(20).toString("hex");

      user.token = token;
      await user.save();

      return res.status(httpStatus.OK).json({
        token: token,
      });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid Username or password",
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: `Something went wrong ${e}`,
    });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  console.log("===== REGISTER REQUEST =====");
  console.log("Name:", name);
  console.log("Username:", username);

  try {
    const existingUser = await User.findOne({ username });

    console.log("Searching username:", username);
    console.log("Existing User:", existingUser);

    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    console.log("User Saved:", newUser);

    return res.status(httpStatus.CREATED).json({
      message: "User Registered",
    });
  } catch (e) {
    console.log("REGISTER ERROR:", e);

    return res.status(500).json({
      message: e.message,
    });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(httpStatus.OK).json([]);
    }

    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(httpStatus.OK).json([]);
    }

    const meetings = await Meeting.find({ user_id: user.username });
    return res.status(httpStatus.OK).json(meetings);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: e.message,
    });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    if (!token) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Token missing" });
    }

    const user = await User.findOne({ token: token });
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid token" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

export { login, register, getUserHistory, addToHistory };
