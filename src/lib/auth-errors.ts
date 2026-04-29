/**
 * Traduz mensagens de erro do Supabase Auth (em inglês) para português.
 * Usado em telas de login, cadastro, reset de senha e troca de senha.
 */
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return 'Algo deu errado. Tente novamente.';
  const raw = String(message);
  const m = raw.toLowerCase();

  // Senha fraca / vazada (HIBP)
  if (m.includes('pwned') || m.includes('compromised') || m.includes('data breach')) {
    return 'Essa senha foi vazada em outros sites e não é segura. Use uma combinação única com letras, números e símbolos.';
  }
  if (m.includes('weak password') || m.includes('password is too weak') || m.includes('password should contain') || m.includes('password should be')) {
    return 'Senha fraca. Use no mínimo 8 caracteres com letras, números e símbolos.';
  }
  if (m.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 8 caracteres.';
  }
  if (m.includes('new password should be different')) {
    return 'A nova senha precisa ser diferente da atual.';
  }

  // Email
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already exists')) {
    return 'Já existe uma conta com este e-mail.';
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'E-mail inválido. Verifique se digitou corretamente.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  }
  if (m.includes('email address') && m.includes('invalid')) {
    return 'E-mail inválido.';
  }

  // Login
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (m.includes('user not found')) {
    return 'Usuário não encontrado.';
  }

  // Sessão / token
  if (m.includes('session') && (m.includes('expired') || m.includes('not found') || m.includes('missing'))) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  if (m.includes('jwt') && m.includes('expired')) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  if (m.includes('token') && (m.includes('expired') || m.includes('invalid'))) {
    return 'Link inválido ou expirado. Solicite um novo.';
  }
  if (m.includes('otp') && m.includes('expired')) {
    return 'Código expirado. Solicite um novo.';
  }

  // Rate limit
  if (m.includes('rate limit') || m.includes('too many') || m.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar de novo.';
  }

  // Rede
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('networkerror')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  }

  // Reauth
  if (m.includes('reauthentication needed') || m.includes('reauthentication required')) {
    return 'Por segurança, faça login novamente para continuar.';
  }

  // Auth genérico
  if (m.includes('not authenticated') || m.includes('unauthorized')) {
    return 'Você precisa estar logado para fazer isso.';
  }

  // Se a mensagem original já parecer estar em português, devolve ela
  if (/[áéíóúâêôãõç]/i.test(raw) || /\b(senha|usuário|e-mail|conta|erro|inválid)/i.test(raw)) {
    return raw;
  }

  return 'Algo deu errado. Tente novamente.';
}