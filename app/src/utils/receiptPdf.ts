import jsPDF from 'jspdf';
import type { Certificate } from '../api/txline';

type BetInfo = { casa: string; mercado: string; odd: string } | null | undefined;

// Gera um PDF do recibo no cliente (sem depender do backend), documentando a prova
// criptografica ja emitida on-chain, para guardar, imprimir ou anexar em outro lugar.
export function downloadReceiptPdf(params: {
    certificate: Certificate;
    commitment: string;
    bet?: BetInfo;
}) {
    const { certificate, commitment, bet } = params;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 0;

    // Cabecalho
    doc.setFillColor(15, 15, 25);
    doc.rect(0, 0, pageWidth, 90, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('RECIBET — Comprovante Oficial', margin, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(180, 220, 200);
    doc.text('Prova criptografica ancorada na blockchain Solana', margin, 60);

    y = 130;
    doc.setTextColor(20, 20, 20);

    const row = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(label.toUpperCase(), margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        const lines = doc.splitTextToSize(value, pageWidth - margin * 2);
        doc.text(lines, margin, y + 16);
        y += 16 + lines.length * 14 + 14;
    };

    const divider = () => {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 20;
    };

    row('Recibo', certificate.receiptId);
    divider();
    row('Partida', `${certificate.match.participant1} x ${certificate.match.participant2}`);
    row(
        'Data da Partida',
        certificate.match.startTime ? new Date(certificate.match.startTime).toLocaleString('pt-BR') : '-'
    );
    row('Placar Final', `${certificate.finalScore.participant1} - ${certificate.finalScore.participant2}`);
    row('Dados Ancorados On-Chain', certificate.dataAnchored.join(', '));
    divider();
    row('Rede', certificate.network);
    row('Data de Emissão', new Date(certificate.issuedAt).toLocaleString('pt-BR'));

    for (const v of certificate.verifications) {
        row(`Transação de Verificação (${v.stats.map(s => s.label).join(', ')})`, v.txHash);
    }

    if (bet) {
        divider();
        row('Aposta Anexada', `${bet.casa || '-'} · ${bet.mercado || '-'} · odd ${bet.odd || '-'}`);
    }

    divider();
    row('Commitment do Recibo', commitment);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
        `Qualquer pessoa pode conferir as transações acima em explorer.solana.com (cluster: ${certificate.network.toLowerCase().includes('devnet') ? 'devnet' : 'mainnet-beta'}).`,
        margin, 780
    );

    doc.save(`recibet-${certificate.receiptId}.pdf`);
}
