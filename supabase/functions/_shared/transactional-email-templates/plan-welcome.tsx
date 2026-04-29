/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface PlanWelcomeProps {
  name?: string
  planName?: string
  benefits?: string[]
}

const APP_URL = 'https://korafinance.app'

const PlanWelcomeEmail = ({
  name,
  planName = 'Pro',
  benefits = [
    'Kora IA com memória ilimitada',
    'WhatsApp com IA financeira',
    'Controle de dívidas e simulador',
    'Lançamentos e metas ilimitadas',
  ],
}: PlanWelcomeProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo(a) ao Kora {planName}! Seus benefícios já estão liberados 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Kora</Text>
        <Heading style={h1}>
          {name ? `${name}, bem-vindo(a) ao Kora ${planName}! 🎉` : `Bem-vindo(a) ao Kora ${planName}! 🎉`}
        </Heading>
        <Text style={text}>
          Seu pagamento foi confirmado e <strong>todos os benefícios do plano {planName} já estão ativos</strong> na sua conta.
        </Text>

        <Section style={card}>
          <Text style={cardTitle}>O que você desbloqueou:</Text>
          {benefits.map((b) => (
            <Text key={b} style={benefit}>✅ {b}</Text>
          ))}
        </Section>

        <Text style={text}>
          Comece agora mesmo a tirar o máximo proveito da Kora — sua inteligência financeira pessoal.
        </Text>

        <Button style={button} href={APP_URL}>
          Acessar minha conta
        </Button>

        <Text style={tip}>
          💡 <strong>Dica:</strong> conecte seu WhatsApp em Configurações → WhatsApp para registrar despesas só conversando com a Kora.
        </Text>

        <Text style={footer}>
          Qualquer dúvida, é só responder este email. Estamos aqui pra te ajudar a chegar onde você quer.
          <br /><br />
          Equipe Kora 🐨
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PlanWelcomeEmail,
  subject: (data: Record<string, any>) =>
    `🎉 Bem-vindo(a) ao Kora ${data?.planName || 'Pro'}!`,
  displayName: 'Boas-vindas ao plano',
  previewData: {
    name: 'Maria',
    planName: 'Pro',
    benefits: [
      'Kora IA com memória ilimitada',
      'WhatsApp com IA financeira',
      'Controle de dívidas e simulador',
      'Lançamentos e metas ilimitadas',
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: '0', padding: '0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 32px', backgroundColor: '#ffffff' }
const logo = { fontSize: '24px', fontWeight: '800' as const, color: '#7C3AED', margin: '0 0 32px', letterSpacing: '-0.02em' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1a0b2e', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#52525b', lineHeight: '1.6', margin: '0 0 20px' }
const card = { backgroundColor: '#F5F3FF', border: '1px solid #E9D5FF', borderRadius: '12px', padding: '20px 24px', margin: '0 0 24px' }
const cardTitle = { fontSize: '13px', fontWeight: '700' as const, color: '#7C3AED', textTransform: 'uppercase' as const, letterSpacing: '0.04em', margin: '0 0 12px' }
const benefit = { fontSize: '14px', color: '#1a0b2e', lineHeight: '1.6', margin: '0 0 6px' }
const button = { backgroundColor: '#7C3AED', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '4px 0 28px' }
const tip = { fontSize: '13px', color: '#52525b', backgroundColor: '#FAFAF9', borderLeft: '3px solid #7C3AED', padding: '12px 16px', borderRadius: '4px', lineHeight: '1.6', margin: '0 0 24px' }
const footer = { fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5', margin: '32px 0 0', paddingTop: '24px', borderTop: '1px solid #f4f4f5' }