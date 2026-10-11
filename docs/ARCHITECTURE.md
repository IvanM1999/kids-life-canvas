# Arquitetura local-first — Kids Life Canvas

## Implementação atual

O app é React + TypeScript + Vite, sem backend. `src/storage.ts` mantém o domínio compartilhado (`Child`, `Memory`, `Attachment`) e persiste o arquivo como um único registro no IndexedDB (`kids-life-canvas`, store `state`, chave `archive`). IndexedDB é armazenamento estruturado e durável do navegador, aceita `Blob` por structured clone e não depende de serviço ou configuração externa. Os bytes de mídia permanecem no dispositivo. Timeline, álbum e canvas são projeções do mesmo estado, não arquivos independentes.

Na primeira inicialização, a aplicação migra os registros legados da chave `kids-life-canvas-state` do localStorage e então remove essa chave somente após a escrita no IndexedDB. Erros de leitura/salvamento são comunicados na interface. Perfis e lembranças de exemplo são demonstrativos e não identificam pessoas reais.

O app shell da build de produção é preparado pelo `public/sw.js` (HTML, CSS e JavaScript), permitindo reabrir a aplicação sem rede na mesma origem/navegador após a instalação do service worker. O conteúdo familiar não é colocado no Cache API: continua no IndexedDB. Em desenvolvimento, o servidor Vite é necessário. A disponibilidade depende do navegador preservar os dados do site; IndexedDB não é backup nem proteção contra remoção do perfil do navegador.

## Arquivos e cópias

Anexos suportados são imagem, vídeo, áudio e PDF, limitados a 20 MB cada. Seus bytes e metadados (nome, tipo, tamanho, horário, origem local) são armazenados com a lembrança. Links HTTP(S) registram apenas o endereço e a indicação `local: false`; não alegam disponibilidade offline. A exportação JSON converte os bytes em base64; a importação valida o formato, avisa que substituirá o arquivo atual e tem limite de 100 MB. Backups são sensíveis e devem permanecer em local privado.

## Limites e evolução

- Não há sincronização automática, login, upload nem integração real com nuvem. Os cartões OneDrive e Drive explicam a dependência de configuração sem simular uma conexão.
- Um próximo adaptador de nuvem exigirá OAuth configurado pelo operador (por exemplo, MSAL para OneDrive e Google Identity/Drive API), escopos mínimos, consentimento explícito, tratamento de expiração/cancelamento/rede e cópia dos bytes importados ao arquivo local. Segredos de cliente e tokens não devem ser gravados no bundle nem em texto puro no IndexedDB.
- A versão atual escolhe IndexedDB em vez de SQLite/WASM: para este app web estático sem serviço local, IndexedDB é uma tecnologia nativa e suportada para objetos/blobs duráveis, sem worker/WASM/VFS adicional e com maior compatibilidade de implantação. Uma futura exigência de consultas relacionais, portabilidade SQLite ou sincronização multi-dispositivo deve reavaliar SQLite WASM com VFS persistente/OPFS e os requisitos reais de browser e backup, mantendo migração explícita.
- Para preservar a simplicidade do MVP, todo o estado da família é gravado como um registro. Crescimento expressivo do acervo poderá motivar stores e transações por entidade, índices, revisão de cotas e exportação incremental.

## Verificações locais

Na raiz do workspace: `npm run build` e `npx tsc --noEmit -p apps/web/tsconfig.json`.
