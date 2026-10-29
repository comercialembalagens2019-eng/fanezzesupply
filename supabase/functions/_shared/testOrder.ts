import { ADMIN_ONLY_PRODUCTS } from "./catalog.ts";

// Admin test orders (test product only) skip the company form: they are billed to FNZ
// Supply itself, delivered in Joinville (free shipping), with e-mails to the admin.
const FNZ_TEST_COMPANY = {
  razao_social: "FNZ Supply Embalagens para Indústria e Comércio Ltda",
  nome_fantasia: "FNZ Supply (teste)",
  cnpj: "56008033000132",
  inscricao_estadual: "263049540",
  natureza_juridica: "2062 - Sociedade Empresária Limitada",
  cnae: "47.89-0-99",
  cep: "89211460",
  endereco: "Avenida Antonio Ramos Alvim",
  numero: "1084",
  complemento: "Andar 2, sala 3",
  bairro: "Floresta",
  cidade: "Joinville",
  estado: "SC",
  whatsapp: "47991490027",
  responsavel_nome: "FNZ Supply",
  responsavel_cpf: "00000000000",
  responsavel_rg: "",
  responsavel_cargo: "socio",
};

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function testCompanyFor(serviceClient: any, user: { id: string; email?: string }, items: unknown) {
  const onlyTestProducts =
    Array.isArray(items) && items.length > 0 && items.every((i) => ADMIN_ONLY_PRODUCTS.has(i?.productId));
  if (!onlyTestProducts) return { error: "Pedido de teste aceita apenas o produto teste" };

  const { data: role } = await serviceClient
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!role) return { error: "Apenas administradores podem fazer pedidos de teste" };

  const { data: existing } = await serviceClient
    .from("companies").select("id").eq("user_id", user.id).eq("cnpj", FNZ_TEST_COMPANY.cnpj).maybeSingle();
  if (existing) return { id: existing.id as string };

  const { data: created, error } = await serviceClient
    .from("companies")
    .insert({ ...FNZ_TEST_COMPANY, user_id: user.id, email: user.email ?? "fanezzesupply@gmail.com" })
    .select("id")
    .single();
  if (error) {
    console.error("[ASAAS] Test company insert failed:", error.message);
    return { error: error.code === "23505" ? "O CNPJ da FNZ já está cadastrado em outra conta" : "Erro ao preparar pedido de teste" };
  }
  return { id: created.id as string };
}
