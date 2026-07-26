# Arquitetura futura do Essencial AI

## Visão

O Essencial AI será uma camada autorizada de assistência, não um bypass das regras do domínio. Nenhuma IA funcional é implementada no Sprint 05.

## Capacidades previstas

- assistente do gerente;
- concierge do hóspede;
- análise de consumo;
- assistência de manutenção e limpeza;
- geração de relatórios;
- operação por linguagem natural.

## Fluxo alvo

```text
Usuario -> Frontend -> API NestJS -> Servico Essencial AI
                                  -> Casos de uso autorizados
                                  -> Banco/adapters
```

O modelo nunca consultará o Supabase ou serviços externos diretamente. A API resolverá identidade, empresa, propriedade, papel e escopo antes de fornecer contexto.

## Dados consultáveis

Com autorização explícita, a IA poderá consultar empresas, propriedades, unidades, reservas, automação, alertas, consumo, manutenção e solicitações do hóspede.

## Segurança futura

- isolamento por organização em toda recuperação de contexto;
- minimização de dados pessoais;
- trilha de auditoria de consultas e ações;
- confirmação humana para ações críticas;
- ferramentas com permissões específicas;
- proteção contra instruções maliciosas em conteúdo externo;
- política de retenção e anonimização.

**Decisão pendente:** provedor e modelos de IA.

**Decisão pendente:** classificação de ações que exigem confirmação humana.

**Decisão pendente:** política de consentimento e retenção de conversas de hóspedes.
