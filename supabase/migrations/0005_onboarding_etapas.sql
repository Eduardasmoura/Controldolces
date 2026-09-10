-- =============================================================================
-- Onboarding em etapas, retomável.
--
-- A usuária pode fechar o navegador no meio e voltar depois. O estado fica no
-- banco, não no navegador: trocar de aparelho não pode significar recomeçar.
--
-- As respostas parciais são gravadas nas próprias tabelas de destino
-- (`profiles` e `businesses`) conforme cada etapa é concluída — não existe um
-- rascunho paralelo que depois precisaria ser copiado.
-- =============================================================================

alter table public.profiles
  add column if not exists onboarding_step smallint not null default 0;

comment on column public.profiles.onboarding_step is
  'Próxima etapa do onboarding a ser exibida. 0 = boas-vindas, 1 = sobre você, 2 = tipo de negócio, 3 = objetivo, 4 = tudo pronto.';

comment on column public.profiles.onboarding_completed_at is
  'Preenchido quando a usuária conclui o onboarding. Enquanto for nulo, as telas do app devolvem para /onboarding.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_onboarding_step_check'
  ) then
    alter table public.profiles
      add constraint profiles_onboarding_step_check check (onboarding_step between 0 and 4);
  end if;
end;
$$;

-- Contas criadas antes desta migração já passaram pelo onboarding antigo:
-- não faz sentido pedir tudo de novo para elas.
update public.profiles
set onboarding_step = 4
where onboarding_completed_at is not null
  and onboarding_step = 0;
