import React from 'react';
import { CreditCard, Download, QrCode, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePDF } from '../../lib/pdf';

export default function FormasPagamento() {
  const [copied, setCopied] = React.useState(false);
  const pixKey = "fabio.bperira@gmail.com";
  // Link de pagamento fornecido
  const cardLink = "https://link.infinitepay.io/fabio_4134/VC1D-9UvdZ7Ec9-50,00";

  // Payload PIX simplificado para a chave (formato BR Code)
  const pixPayload = `00020101021126480014br.gov.bcb.pix0126${pixKey}5204000053039865802BR5913PROFOLI Admin6009Sao Paulo62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const columns = ['Forma de Pagamento', 'Detalhes/Instruções'];
    const data = [
      ['PIX', `Chave E-mail: ${pixKey}`],
      ['Cartão de Crédito', 'Acesse o link de pagamento disponibilizado no sistema'],
      ['Dinheiro', 'Pagamento presencial na secretaria']
    ];
    generatePDF('Formas de Pagamento - PROFOLI', columns, data);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <CreditCard size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Formas de Pagamento Aceitas</h2>
        </div>
        
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto justify-center"
        >
          <Download size={18} />
          <span>Baixar PDF</span>
        </button>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PIX Section */}
          <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5 md:p-6 flex flex-col items-center text-center">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full mb-4">
              <QrCode size={32} />
            </div>
            <h3 className="text-xl font-bold text-emerald-900 mb-2">Pagamento via PIX</h3>
            <p className="text-emerald-700 mb-6 text-sm">Escaneie o QR Code abaixo ou copie a chave PIX</p>
            
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 inline-block">
              <QRCodeSVG 
                value={pixPayload} 
                size={180} 
                level="M"
                includeMargin={false}
              />
            </div>
            
            <div className="w-full max-w-sm">
              <p className="text-sm font-medium text-emerald-800 mb-2 text-left">Chave PIX (E-mail):</p>
              <div className="flex items-center bg-white border border-emerald-200 rounded-lg overflow-hidden">
                <input 
                  type="text" 
                  readOnly 
                  value={pixKey} 
                  className="w-full px-4 py-3 text-gray-700 outline-none bg-transparent font-medium"
                />
                <button 
                  onClick={handleCopyPix}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 transition-colors flex items-center justify-center min-w-[100px]"
                >
                  {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                  <span className="ml-2 font-medium">{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cartão Section */}
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 md:p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-100 text-blue-700 p-3 rounded-full mb-4">
              <CreditCard size={32} />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Cartão de Crédito</h3>
            <p className="text-blue-700 mb-6 text-sm max-w-xs">
              Pague sua inscrição de forma segura utilizando seu cartão de crédito
            </p>
            
            <a 
              href={cardLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center space-x-3 shadow-sm w-full max-w-sm justify-center"
            >
              <span>Acessar Link de Pagamento</span>
              <ExternalLink size={20} />
            </a>
            
            <p className="text-xs text-blue-600 mt-6 max-w-xs">
              Você será redirecionado para um ambiente de pagamento seguro.
            </p>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-50 p-5 md:p-6 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 text-lg">Instruções Importantes:</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
            <li>O valor da inscrição é de <strong>R$ 50,00</strong>.</li>
            <li>Após o pagamento via PIX, envie o comprovante para a secretaria para agilizar a baixa.</li>
            <li>Pagamentos no Cartão de Crédito são aprovados automaticamente.</li>
            <li>Caso não possa efetuar o pagamento no momento da inscrição, Não se preocupe, procure um dos responsáveis e negocie modalidade e prazo.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
