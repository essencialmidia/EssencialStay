# Propriedades

Propriedade é o local de hospedagem pertencente a uma organização: hotel, pousada, hostel, resort, apartamento, casa e tipos equivalentes aceitos pelo banco. Ela nunca pertence diretamente a um usuário.

Cada propriedade possui cadastro, endereço, horários, fuso, status e unidades. Automação, recursos inteligentes, ambientes e integrações funcionais são configurados no contexto da propriedade. Uma conexão técnica externa pode pertencer à organização e atender uma ou mais propriedades mediante vínculo explícito.

Inativação/cancelamento deve preservar histórico. Códigos e vínculos precisam respeitar tenant, RLS e constraints. Veja [unidades](rooms.md) e `docs/automation-property-model.md`.
