import { ImageResponse } from 'next/og';

/**
 * Imagem de compartilhamento da landing page.
 *
 * Gerada em tempo de build a partir da própria identidade visual, sem depender de
 * um arquivo binário no repositório nem de fonte externa.
 */
export const alt = 'ControlDolces — saiba quanto custa e quanto cobrar pelos seus doces';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FDFBF8',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#B24460',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 9, background: '#F6B96F' }} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: '#2E2A26' }}>ControlDolces</div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.1,
              color: '#1C1A17',
              maxWidth: 900,
            }}
          >
            Descubra quanto cobrar pelos seus doces
          </div>
          <div style={{ fontSize: 32, color: '#5E5750', maxWidth: 860 }}>
            Custo real, preço mínimo e preço recomendado — sem achismo.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            ['Custo por unidade', 'R$ 2,45'],
            ['Preço recomendado', 'R$ 6,14'],
            ['Margem', '60%'],
          ].map(([rotulo, valor]) => (
            <div
              key={rotulo}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '18px 26px',
                borderRadius: 18,
                border: '1px solid #E7E1DB',
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: 20, color: '#7D746C' }}>{rotulo}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: '#1C1A17' }}>{valor}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
