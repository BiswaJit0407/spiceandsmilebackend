const PDFDocument = require("pdfkit");

function streamRecipePdf(recipe, res, lang = "en") {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(recipe.title?.[lang] || "recipe").replace(/[^a-z0-9]+/gi, "_")}.pdf"`
  );
  doc.pipe(res);

  doc.fillColor("#D4523C").fontSize(26).text(recipe.title?.[lang] || recipe.title?.en || "Recipe");
  doc.moveDown(0.3);
  doc.fillColor("#2C3E50").fontSize(11).text(
    `Prep: ${recipe.prepTime || 0} min · Cook: ${recipe.cookTime || 0} min · Serves: ${recipe.servings || "-"} · Spice: ${"🌶️".repeat(recipe.spiceLevel || 0)}`
  );
  doc.moveDown();

  if (recipe.description?.[lang] || recipe.description?.en) {
    doc.fontSize(12).text(recipe.description[lang] || recipe.description.en);
    doc.moveDown();
  }

  if (recipe.authorNotes?.[lang] || recipe.authorNotes?.en) {
    doc.fillColor("#2D5016").fontSize(14).text("A Note From Me");
    doc.fillColor("#2C3E50").fontSize(11).text(recipe.authorNotes[lang] || recipe.authorNotes.en);
    doc.moveDown();
  }

  doc.fillColor("#2D5016").fontSize(14).text("Ingredients");
  doc.fillColor("#2C3E50").fontSize(11);
  (recipe.ingredients?.[lang] || recipe.ingredients?.en || []).forEach((ing) => {
    doc.text(`• ${ing.quantity || ""} ${ing.unit || ""} ${ing.item || ""}`.trim());
  });
  doc.moveDown();

  doc.fillColor("#2D5016").fontSize(14).text("Method");
  doc.fillColor("#2C3E50").fontSize(11);
  (recipe.method?.[lang] || recipe.method?.en || []).forEach((s) => {
    doc.text(`${s.step}. ${s.instruction}`);
    doc.moveDown(0.2);
  });

  if ((recipe.tips?.[lang] || recipe.tips?.en || []).length) {
    doc.moveDown();
    doc.fillColor("#2D5016").fontSize(14).text("Tips");
    doc.fillColor("#2C3E50").fontSize(11);
    (recipe.tips[lang] || recipe.tips.en).forEach((t) => doc.text(`• ${t}`));
  }

  doc.moveDown(2);
  doc.fillColor("#F5A623").fontSize(10).text("Spice&Smile — From Our Kitchen to Your Heart", {
    align: "center",
  });

  doc.end();
}

module.exports = { streamRecipePdf };
