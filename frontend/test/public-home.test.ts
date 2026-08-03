import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync(new URL("../src/pages/home.tsx", import.meta.url), "utf8");
const router = readFileSync(new URL("../src/routes/router.tsx", import.meta.url), "utf8");
const globalHomeButton = readFileSync(new URL("../src/components/navigation/global-home-button.tsx", import.meta.url), "utf8");
const supabaseClient = readFileSync(new URL("../src/lib/supabase.ts", import.meta.url), "utf8");

test("a home comercial ocupa a raiz sem alterar os guards de autenticação", () => {
  assert.match(router, /path: "\/", element: <HomePage \/>/);
  assert.match(router, /element: <PublicRoute \/>[\s\S]*path: "\/login", element: <LoginPage \/>/);
  assert.match(router, /element: <ProtectedRoute \/>[\s\S]*path: "dashboard", element: <DashboardPage \/>/);
  assert.doesNotMatch(router, /index: true, element: <Navigate to="\/dashboard"/);
  assert.match(globalHomeButton, /location\.pathname !== "\/"/);
  assert.match(supabaseClient, /isSupabaseConfigured/);
  assert.doesNotMatch(supabaseClient, /throw new Error\(`A variável/);
});

test("rotas públicas dos demos permanecem registradas", () => {
  for (const route of ["/demo/29-07", "/demo/29-07/portal", "/s/hotel-monaco-demo", "/s/vila-nova-demo", "/s/vila-nova/:slug"]) {
    assert.match(router, new RegExp(`path: "${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
});

test("a home contém os CTAs, seções e ressalvas comerciais aprovados", () => {
  assert.match(home, /Plataforma e ecossistema para hospitalidade/i);
  assert.match(home, /A tecnologia que conecta o hóspede à/);
  assert.match(home, /A Essencial Stay integra a jornada do hóspede, o acesso e a automação/);
  assert.match(home, /Um ecossistema de soluções, equipamentos e parceiros/);
  assert.match(home, /id="solucoes"/);
  assert.match(home, /id="plataforma"/);
  assert.match(home, /id="ecossistema"/);
  assert.match(home, /id="revendas"/);
  assert.match(home, /Conheça as soluções/);
  assert.doesNotMatch(home, /Quero ser revenda/);
  assert.match(home, /Entrar na plataforma/);
  assert.equal(home.match(/<Link to="\/login"/g)?.length, 5);
  assert.match(home, /pointer-events-none absolute inset-0/);
  assert.match(home, /Dispositivos/);
  assert.match(home, /Painéis, fechaduras, sensores e módulos/);
  assert.match(home, /Estrutura preparada para diferentes operações/);
  assert.match(home, /Experiências disponíveis para demonstração/);
  assert.match(home, /Tecnologias em processo de validação/);
  assert.match(home, /não representa, por si só, integração técnica concluída/);
  assert.match(home, /target="_blank" rel="noopener noreferrer"/);
  assert.match(home, /https:\/\/wa\.link\/dalym4/);
  assert.doesNotMatch(home, /wa\.me\/5511982296051/);
  assert.match(home, /whatsapp-essencial-stay-qr\.png/);
  assert.match(home, /QR Code do WhatsApp da Essencial Stay/);
  assert.match(home, /Contato inicial/);
  assert.match(home, /Vamos conversar/i);
  assert.doesNotMatch(home, /<form|BrandMark/);
});
