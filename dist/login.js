(() => {
  const params = new URLSearchParams(location.search);
  const errors = {
    config: 'Acesso indisponível: a administração precisa configurar o provedor e a lista de autorizados no servidor.',
    provider: 'Não foi possível conectar ao provedor. Tente novamente.',
    identity: 'Confirmação inválida. Tente novamente para receber uma nova confirmação do provedor.',
    expired: 'Sua confirmação expirou. Tente novamente para iniciar um novo acesso.',
    cancelled: 'A confirmação foi cancelada no provedor. Você pode tentar novamente.',
    denied: 'Sua identidade não está autorizada a acessar o Vanguarda. Solicite acesso à administração.',
    request: 'Não foi possível validar esta solicitação. Recarregue a página e tente novamente.'
  };
  const form = document.querySelector('#confirm-form');
  const button = document.querySelector('#confirm-access');
  const status = document.querySelector('#login-status');
  let pending = false;
  function ready(message, error = false) {
    pending = false;
    button.disabled = false;
    button.setAttribute?.('aria-busy', 'false');
    button.textContent = 'Confirmar';
    form.setAttribute('aria-busy', 'false');
    status.textContent = message;
    status.setAttribute?.('data-state', error ? 'error' : 'ready');
  }
  const demo = document.body?.dataset.authMode === 'demo';
  ready(demo ? 'Modo demonstração · dados fictícios.' : (errors[params.get('error')] || 'Confirme para entrar com sua identidade corporativa.'), !demo && Boolean(errors[params.get('error')]));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    pending = true;
    button.disabled = true;
    button.setAttribute?.('aria-busy', 'true');
    button.textContent = 'Entrando…';
    form.setAttribute('aria-busy', 'true');
    status.setAttribute?.('data-state', 'pending');
    status.textContent = 'Entrando… Validando seu acesso.';
    try {
      const response = await fetch('/auth/confirm', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json();
      if (!response.ok) throw Error(errors[result.error] || 'Não foi possível concluir o acesso. Tente novamente.');
      const destination = new URL(result.redirect, location.origin);
      if (result.redirect !== '/#dashboard' && destination.protocol !== 'https:') throw Error('Resposta de acesso inválida. Tente novamente.');
      // Demo returns the Dashboard; secure mode returns the configured provider.
      window.location.replace(destination.href);
    } catch (error) {
      ready(error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'Não foi possível conectar para confirmar o acesso. Tente novamente.'
        : error.message, true);
    }
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) window.location.reload();
  });
})();
