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

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email na Kora</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Kora</Text>
        <Heading style={h1}>Confirme seu email</Heading>
        <Text style={text}>
          Que bom ter você aqui! Pra começar a usar a{' '}
          <Link href={siteUrl} style={link}><strong>Kora</strong></Link>,
          {' '}precisamos confirmar seu email
          {' '}(<Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>).
        </Text>
        <Text style={text}>
          Clique no botão abaixo pra ativar sua conta:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar email
        </Button>
        <Text style={footer}>
          Se você não criou uma conta na Kora, pode ignorar este email com tranquilidade.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: '0', padding: '0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 32px', backgroundColor: '#ffffff' }
const logo = { fontSize: '24px', fontWeight: '800' as const, color: '#7C3AED', margin: '0 0 32px', letterSpacing: '-0.02em' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1a0b2e', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#52525b', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#7C3AED', textDecoration: 'underline', fontWeight: '500' as const }
const button = { backgroundColor: '#7C3AED', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0 28px' }
const footer = { fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5', margin: '32px 0 0', paddingTop: '24px', borderTop: '1px solid #f4f4f5' }
