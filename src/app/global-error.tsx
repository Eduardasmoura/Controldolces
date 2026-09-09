'use client';

/**
 * Última rede de proteção: um erro no layout raiz. Precisa carregar html/body
 * por conta própria, então não usa os componentes compartilhados.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#FDFBF8',
          color: '#2E2A26',
          fontFamily: 'system-ui, sans-serif',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem' }}>
            Algo saiu do lugar por aqui
          </h1>
          <p style={{ margin: '0 0 1.5rem', color: '#5E5750', lineHeight: 1.6 }}>
            Seus dados estão salvos. Recarregue a página para continuar.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: '2.75rem',
              padding: '0 1.25rem',
              borderRadius: '0.875rem',
              border: 'none',
              background: '#B24460',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
