# Kids Life Canvas

Um arquivo familiar privado para guardar memórias, fotos e pequenos marcos — em português e com funcionamento local-first.

## Rodar localmente

Requisitos: Node.js 18+ e npm.

```sh
npm install
npm run dev
```

Abra o endereço local informado pelo Vite. Para validar a versão de produção:

```sh
npm run build
npm run preview
```

Depois da primeira abertura da versão de produção, o app shell pode ser reaberto offline pelo mesmo navegador/origem. Em desenvolvimento, o servidor Vite ainda é necessário. Não há fontes, fotos de demonstração, analytics ou outros recursos remotos necessários.

## Dados, privacidade e mídia

- O acervo é guardado no **IndexedDB** do navegador; imagens, vídeos, áudios e PDFs são gravados como bytes locais junto aos metadados e vínculos da lembrança. Nada é enviado automaticamente.
- Os perfis e momentos iniciais são exemplos editáveis, não representam uma família real. Crie, edite, filtre ou remova registros e organize-os por tema, pessoa, timeline, álbum e mapa orbital.
- O armazenamento pertence ao perfil do navegador e à origem do app: limpar os dados do site, trocar navegador/dispositivo ou perder o perfil pode apagar o acervo. Arquivos locais não são criptografados pela aplicação. Proteja o dispositivo e seus backups.
- Anexos locais aceitos: imagem, vídeo, áudio e PDF, até 20 MB por arquivo. Arquivos maiores não são copiados. Um link externo é apenas um atalho: seus bytes não foram baixados e ele não fica disponível offline.
- Use **Arquivo & cópias → Baixar cópia de segurança** para exportar um JSON que inclui as mídias. Guarde-o em local privado; ele contém informações familiares e pode ser grande. Restaurar uma cópia substitui o acervo deste navegador. A importação está limitada a 100 MB.
- Se havia registros na versão antiga guardados em `localStorage` sob `kids-life-canvas-state`, eles são migrados uma vez para o IndexedDB na primeira inicialização compatível. Faça backup antes de limpar dados do navegador.

## Nuvem

OneDrive e Google Drive aparecem como conectores não configurados; os botões **não conectam contas nem importam arquivos**. A implementação não possui backend, registro de aplicativo OAuth, credenciais ou fluxo de autenticação. Não cole tokens no app nem configure segredos no cliente. Conectores reais exigirão decisão de arquitetura, OAuth com escopos mínimos e fluxo explícito de importação/armazenamento local; até lá, o arquivo offline funciona sem essas integrações.

Leia [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para os detalhes de armazenamento, disponibilidade offline e próximos passos de integração.
