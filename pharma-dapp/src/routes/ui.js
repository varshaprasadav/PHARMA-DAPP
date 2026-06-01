import express from "express";
const router = express.Router();

const CONTRACT_ADDRESS = "0xd923A95aEc6157aCCA8E84B6C4c9C2b3C7422a40";

router.get("/",            (req, res) => res.render("home",       { CONTRACT_ADDRESS }));
router.get("/add",         (req, res) => res.render("add",        { CONTRACT_ADDRESS }));
router.get("/medicines",   (req, res) => res.render("medicines",  { CONTRACT_ADDRESS }));
router.get("/transfer",    (req, res) => res.render("transfer",   { CONTRACT_ADDRESS }));
router.get("/distributor", (req, res) => res.render("distributor",{ CONTRACT_ADDRESS }));
router.get("/pharmacy",    (req, res) => res.render("pharmacy",   { CONTRACT_ADDRESS }));
router.get("/track",       (req, res) => res.render("track",      { CONTRACT_ADDRESS }));
router.get("/verify",      (req, res) => res.render("verify",     { CONTRACT_ADDRESS }));

export default router;
