/**
 * Bobotcho Knowledge Base
 * Authoritative source for product info, pricing, and FAQ.
 */

export interface ProductInfo {
  name: string;
  standardPrice: number;
  whatsappPromoPrice: number;
  installationFee: number;
  currency: string;
  benefits: string[];
}

export const BOBOTCHO_DATA: ProductInfo = {
  name: "Bobotcho",
  standardPrice: 120000,
  whatsappPromoPrice: 60000,
  installationFee: 10000,
  currency: "XOF",
  benefits: [
    "Installation facile et rapide",
    "Économie d'énergie significative",
    "Support technique local à Abidjan",
    "Garantie constructeur incluse"
  ]
};

export const FAQ_ITEMS = [
  {
    question: "Comment se passe l'installation ?",
    answer: "Un technicien se déplace chez vous à Abidjan pour une installation complète. Les frais sont de 10.000 XOF."
  },
  {
    question: "Quel est le prix ?",
    answer: "Le prix standard est de 120.000 XOF, mais via WhatsApp, vous bénéficiez d'une offre exclusive à 60.000 XOF (+10.000 d'installation)."
  }
];

/**
 * Returns a formatted string ready to be injected into the AI system prompt.
 */
export function getKnowledgeContext(): string {
  return `
# BASE DE CONNAISSANCES BOBOTCHO
Produit: ${BOBOTCHO_DATA.name}
Prix Standard: ${BOBOTCHO_DATA.standardPrice} ${BOBOTCHO_DATA.currency}
OFFRE EXCLUSIVE WHATSAPP: ${BOBOTCHO_DATA.whatsappPromoPrice} ${BOBOTCHO_DATA.currency}
Frais d'installation: ${BOBOTCHO_DATA.installationFee} ${BOBOTCHO_DATA.currency}

## Avantages:
${BOBOTCHO_DATA.benefits.map(b => `- ${b}`).join('\n')}

## FAQ:
${FAQ_ITEMS.map(item => `Q: ${item.question}\nR: ${item.answer}`).join('\n\n')}
`.trim();
}
