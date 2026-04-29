/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>🐨 KORA FINANCE</Text>
        <Heading style={h1}>Confirme seu email</Heading>
        <Text style={text}>
          Boas-vindas ao{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          ! Estamos animados em te ajudar a sair das dívidas e organizar sua vida financeira.
        </Text>
        <Text style={text}>
          Pra começar, confirme o email <strong>{recipient}</strong> clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar email
        </Button>
        <Text style={footer}>
          Se você não criou uma conta, pode ignorar este email com tranquilidade.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '13px', fontWeight: 'bold' as const, color: '#7C3AED', letterSpacing: '0.5px', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#7C3AED', textDecoration: 'underline' }
const button = { backgroundColor: '#7C3AED', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' as const }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '32px 0 0', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }
