const express = require("express");
// const isAuthenticated = require("./middlewares/isAuthenticated");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

// import models

const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");
const Offer = require("../models/Offer");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;

    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      owner: req.user,
    });

    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: `/vinted/offer/${newOffer._id}`,
    });

    // console.log(result);
    // Ajouter le result de l'upload à newOffer
    newOffer.product_image = result;
    // Sauvegarder l'annonce
    await newOffer.save();

    // Répondre au client
    console.log(newOffer);
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    // Déclarer un objet vide
    let filters = {};
    // Alimenter cet objet en fonction des queries reçues
    if (req.query.title) {
      // ajouter un clé product_name à filters
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = { $gte: Number(req.query.priceMin) }; // greater than or equal
    }

    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = { $lte: Number(req.query.priceMax) }; // lower than or equal
      }
    }

    let sort = {};

    if (req.query.sort === "price-desc") {
      sort.product_price = -1; // "desc"
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1; // "asc"
    }

    // req.query.page
    const limit = Number(req.query.limit);
    let page;
    if (Number(req.query.page) > 0) {
      page = (Number(req.query.page) - 1) * limit;
    } else {
      page = 0;
    }

    // Passer cet objet dans le .find
    const results = await Offer.find(filters)
      .sort(sort)
      .populate("owner", "account") // populate owner, en sélectionnant seulement la clé account
      // .populate({
      //   path: "owner",
      //   select: "account",
      // })
      .skip(page)
      .limit(limit);

    // calculer le nombre de résultats
    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      results: results,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

//     product_name: new RegExp("playstation", "i"
// rechercher un mot dans le titre
//   const results = await Offer.find({
//     product_name: new RegExp("playstation", "i"),
//   }).select("product_name product_price");
// filter par prix supérieurs ou inférieurs à
// $gte = greater than or equal >=
// $gt = >
// $lte = <=
// $lt = <
//   const results = await Offer.find({
//     product_price: { $lte: 200, $gte: 20 },
//   }).select("product_name product_price");
// trier les résultats par prix croissants/décroissants
// "asc" / "desc" === 1 / -1
//   const results = await Offer.find()
//     .sort({ product_price: -1 })
//     .select("product_name product_price");
// Pagination
// skip() et limit()
// SKIP : le nombre de résultats à ignorer
// LIMIT : le nombre de résultats à renvoyer au client
// const results = await Offer.find()
//   .skip(3)
//   .limit(3)
//   .select("product_name product_price");
// res.json(results);
