// Single source for the company's public contact details (site, legal pages and footer).
export const COMPANY = {
  name: "FNZ Supply",
  legalName: "FNZ Supply Embalagens para Indústria e Comércio Ltda" as string | null,
  cnpj: "56.008.033/0001-32" as string | null,
  address: "Av. Antonio Ramos Alvim, 1084, 2º andar, sala 3 · Floresta · Joinville/SC · CEP 89211-460",
  shortAddress: "Av. Antonio Ramos Alvim, 1084 · Floresta · Joinville/SC",
  email: "vendas@fnzsupply.com.br",
  // WhatsApp is the only phone line the company answers.
  phone: "(47) 99149-0027",
  hours: "Atendimento 24h",
};

export const WHATSAPP_URL = "https://wa.me/5547991490027";
export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Av. Antonio Ramos Alvim, 1084, Floresta, Joinville - SC, 89211-460");

export const whatsappWith = (message: string) => `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
