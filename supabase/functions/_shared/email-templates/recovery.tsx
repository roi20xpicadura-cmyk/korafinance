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
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha na Kora</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Kora</Text>
        <Heading style={h1}>Redefina sua senha</Heading>
        <Text style={text}>
          Recebemos um pedido para redefinir a senha da sua conta Kora.
          Clique no botão abaixo pra escolher uma nova senha.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Redefinir senha
        </Button>
        <Text style={footer}>
          Se você não solicitou essa alteração, pode ignorar este email — sua senha continuará a mesma.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: '0', padding: '0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 32px', backgroundColor: '#ffffff' }
const logo = { fontSize: '24px', fontWeight: '800' as const, color: '#7C3AED', margin: '0 0 32px', letterSpacing: '-0.02em' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1a0b2e', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#52525b', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#7C3AED', textDecoration: 'underline', fontWeight: '500' as const }
const button = { backgroundColor: '#7C3AED', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0 28px' }
const footer = { fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5', margin: '32px 0 0', paddingTop: '24px', borderTop: '1px solid #f4f4f5' }
