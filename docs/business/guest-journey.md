# Jornada do hóspede

## Estado: experiência demonstrativa

O frontend contém portal e jornadas guiadas com fixtures para demonstrar reserva, preparação, acesso, estadia, checkout e pós-hospedagem. Há também telas de CRM e experiência do hóspede. Esses fluxos não equivalem a um módulo persistente de hóspedes, hospedagens ou mensagens.

O banco atual não possui entidades operacionais `hospedes` ou `reservas`. Integrações PMS, mensagens e geração real de PIN permanecem fora do escopo entregue.

Qualquer evolução deve aplicar consentimento, minimização, retenção, isolamento por tenant e mascaramento de acesso temporário. PINs nunca são visíveis ao administrador global nem registrados em logs.
