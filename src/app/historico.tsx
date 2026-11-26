import { EmptyState, SecondaryScreen } from '../features/secondary-screen';

export default function HistoryScreen() {
  return (
    <SecondaryScreen title="Histórico">
      <EmptyState icon="history" title="Nenhum desafio registrado"
        description="Abra a aba Desafios e escolha um exercício para treinar." />
    </SecondaryScreen>
  );
}
