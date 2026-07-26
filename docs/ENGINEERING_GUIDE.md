# ENGINEERING GUIDE

**Projeto:** Essencial Stay\
**Versão:** 1.0\
**Status:** Documento Oficial

## Objetivo

Este documento define os princípios de engenharia do Essencial Stay e
complementa a Architecture v2.0.

## Filosofia

O Essencial Stay é uma plataforma SaaS para hospitalidade inteligente
que integra PMS, automação, controle de acesso e experiência do hóspede
de forma desacoplada.

## Princípios

### Vendor Agnostic

Sempre utilizar abstrações (PMSProvider, AutomationProvider,
LockProvider e NotificationProvider).

### Capability Driven

A interface depende de capacidades, nunca da marca do fabricante.

### Domain First

Toda regra de negócio pertence ao domínio da aplicação.

### Multi-Tenant

Administrador → Organização → Propriedade → Unidade → Ambiente →
Dispositivo.

### Backend First

Toda integração externa acontece pelo backend.

## Segurança

-   Tokens: armazenar apenas SHA-256.
-   PINs: usar AES-256-GCM quando precisarem ser persistidos.
-   Nunca expor segredos no frontend.

## Frontend

Responsável apenas por apresentação e consumo de APIs.

## Backend

Responsável por autenticação, autorização, integrações, auditoria e
orquestração.

## Portal do Hóspede

Toda funcionalidade deve melhorar a experiência do hóspede.

## Ordem de Prioridade

1.  Experiência do hóspede
2.  Segurança
3.  Escalabilidade
4.  Performance
5.  Elegância do código

## Fluxo Oficial

Product Owner → Architecture Review → Design Review → Implementation →
Code Review → Architecture Review → Merge

## Lema

A tecnologia existe para tornar a hospedagem simples, segura e
memorável.
