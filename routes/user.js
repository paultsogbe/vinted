const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();

// import models
const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    // const { date, name, seats } = req.fields;
    // ne pas créer d'event qui ont le même nom pour la même date
    // Etape1 : vérifier qu'il n'y a pas déjà un user qui possède cet email
    const user = await User.findOne({ email: email });
    if (!user) {
      if (username && password) {
        // / Etape2 : encrypter le mot de passe (uid2, crypto-js), générer le token
        const salt = uid2(16);
        const token = uid2(64);
        const hash = SHA256(salt + password).toString(encBase64);
        // const avatar = await cloudinary.uploader.upload(req.files.picture.path, {
        //   folder: "/vinted",
        // });
        // Etape3 : créer le nouveau user
        const newUser = new User({
          email: email,
          account: {
            username: username,
            phone: phone,
          },
          token: token,
          salt: salt,
          hash: hash,
        });

        await newUser.save();
        // Etape4 : répondre au client
        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(400).json({ message: "Missing parameters" });
      }
    } else {
      res.status(409).json({ message: "This email already has an account" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    // Etape1 : chercher le user qui souhaite se connecter
    const user = await User.findOne({ email: email });
    if (user) {
      // Etape2 : vérifier que le mot de passe est le bon
      const newHash = SHA256(user.salt + password).toString(encBase64);
      if (newHash === user.hash) {
        // Etape3 : répondre au client OK
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
