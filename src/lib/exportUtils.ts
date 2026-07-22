import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { AIChatMessage } from '../types';

/**
 * Clean plain text formatter for LaTeX and markdown elements in exported documents
 */
function cleanTextForExport(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s?/g, '');
}

/**
 * Export Chat History as a formatted PDF Document
 */
export async function exportChatHistoryToPDF(
  messages: AIChatMessage[],
  subjectName: string = 'General Studies'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 50;

  // Header Banner
  doc.setFillColor(26, 26, 26); // Dark primary background
  doc.rect(margin, cursorY, contentWidth, 54, 'F');

  doc.setTextColor(251, 251, 249);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SemOS AI Tutor Study Notes & Chat Log', margin + 16, cursorY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(166, 137, 66); // Gold accent
  doc.text(`Subject: ${subjectName}  |  Generated: ${dateStr}`, margin + 16, cursorY + 42);

  cursorY += 75;

  // Render Messages
  for (const msg of messages) {
    const isUser = msg.sender === 'user';
    const cleanedMessage = cleanTextForExport(msg.text);

    // Calculate box height based on wrapped text lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitLines = doc.splitTextToSize(cleanedMessage, contentWidth - 24);
    const boxHeight = splitLines.length * 14 + 32;

    // Check page overflow
    if (cursorY + boxHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 10;
    }

    // Message Container
    if (isUser) {
      doc.setFillColor(246, 244, 240); // Soft neutral gray
      doc.setDrawColor(234, 231, 224);
    } else {
      doc.setFillColor(251, 251, 249); // Clean ivory
      doc.setDrawColor(166, 137, 66); // Gold border for AI
    }
    doc.roundedRect(margin, cursorY, contentWidth, boxHeight, 6, 6, 'FD');

    // Sender Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    if (isUser) {
      doc.setTextColor(26, 26, 26);
      doc.text(`STUDENT  (${msg.timestamp || 'Just now'})`, margin + 12, cursorY + 18);
    } else {
      doc.setTextColor(166, 137, 66);
      doc.text(`AI TUTOR [${(msg.mode || 'Feynman').toUpperCase()} MODE]  (${msg.timestamp || 'Just now'})`, margin + 12, cursorY + 18);
    }

    // Divider Line inside box
    doc.setDrawColor(220, 220, 220);
    doc.line(margin + 12, cursorY + 24, margin + contentWidth - 12, cursorY + 24);

    // Message Body Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    
    let textY = cursorY + 38;
    for (const line of splitLines) {
      doc.text(line, margin + 12, textY);
      textY += 14;
    }

    cursorY += boxHeight + 14;
  }

  // Footer on final page
  if (cursorY + 30 > pageHeight - margin) {
    doc.addPage();
    cursorY = margin;
  }
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Generated via SemOS Academic Productivity Engine', margin, pageHeight - 20);

  // Trigger Download
  const filename = `AI_Tutor_Chat_Log_${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export Chat History as a Word (.docx) Document
 */
export async function exportChatHistoryToWord(
  messages: AIChatMessage[],
  subjectName: string = 'General Studies'
): Promise<void> {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const childrenParagraphs: Paragraph[] = [];

  // Document Title
  childrenParagraphs.push(
    new Paragraph({
      text: 'SemOS AI Tutor Study Notes & Chat Log',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
    })
  );

  // Subtitle / Metadata
  childrenParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Subject: ${subjectName}`, bold: true, color: '1A1A1A' }),
        new TextRun({ text: `   |   Generated: ${dateStr}`, color: '777777' }),
      ],
      spacing: { after: 240 },
    })
  );

  // Message Entries
  for (const msg of messages) {
    const isUser = msg.sender === 'user';
    const cleanedText = cleanTextForExport(msg.text);

    // Sender Heading
    childrenParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isUser
              ? `STUDENT (${msg.timestamp || 'Just now'})`
              : `AI TUTOR [${(msg.mode || 'Feynman').toUpperCase()} MODE] (${msg.timestamp || 'Just now'})`,
            bold: true,
            color: isUser ? '1A1A1A' : 'A68942',
            size: 22,
          }),
        ],
        spacing: { before: 180, after: 60 },
      })
    );

    // Message Body Lines
    const lines = (cleanedText || '').split('\n');
    for (const line of lines) {
      if (line && line.trim()) {
        childrenParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 20,
                color: '222222',
              }),
            ],
            spacing: { after: 60 },
            indent: { left: 240 },
          })
        );
      }
    }
  }

  // Footer note
  childrenParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '— End of Chat Export • SemOS Academic Productivity Engine —',
          italics: true,
          color: '888888',
          size: 18,
        }),
      ],
      spacing: { before: 360 },
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: childrenParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `AI_Tutor_Chat_Log_${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, filename);
}
