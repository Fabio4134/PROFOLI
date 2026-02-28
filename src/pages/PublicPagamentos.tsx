import React from 'react';
import { CreditCard, QrCode, ExternalLink, Copy, CheckCircle2, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

export default function PublicPagamentos() {
  const [copied, setCopied] = React.useState(false);
  const pixKey = "fabio.bperira@gmail.com";
  const cardLink = "https://link.infinitepay.io/fabio_4134/VC1D-9UvdZ7Ec9-50,00";

  const pixPayload = `00020101021126480014br.gov.bcb.pix0126${pixKey}5204000053039865802BR5913PROFOLI Admin6009Sao Paulo62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#1e3a8a] text-white p-4 flex items-center shadow-md">
        <Link to="/" className="flex items-center space-x-2 hover:text-blue-200 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">Voltar ao Início</span>
        </Link>
        <h1 className="text-xl font-bold mx-auto pr-8">Pagamento da Inscrição</h1>
      </div>

      <div className="flex-grow max-w-4xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Escolha a Forma de Pagamento</h2>
            <p className="text-gray-600 mt-2">Valor da Inscrição: <strong className="text-blue-700 text-lg">R$ 50,00</strong></p>
          </div>

          <div className="p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* PIX Section */}
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center shadow-sm">
                <div className="bg-emerald-100 text-emerald-700 p-4 rounded-full mb-4">
                  <QrCode size={36} />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900 mb-2">Pagamento via PIX</h3>
                <p className="text-emerald-700 mb-6">Escaneie o QR Code abaixo ou copie a chave PIX</p>
                
                <div className="bg-white p-4 rounded-xl shadow-md mb-6 inline-block">
                  <QRCodeSVG 
                    value={pixPayload} 
                    size={200} 
                    level="M"
                    includeMargin={false}
                  />
                </div>
                
                <div className="w-full max-w-sm">
                  <p className="text-sm font-medium text-emerald-800 mb-2 text-left">Chave PIX (E-mail):</p>
                  <div className="flex items-center bg-white border border-emerald-200 rounded-lg overflow-hidden shadow-sm">
                    <input 
                      type="text" 
                      readOnly 
                      value={pixKey} 
                      className="w-full px-4 py-3 text-gray-700 outline-none bg-transparent font-medium"
                    />
                    <button 
                      onClick={handleCopyPix}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 transition-colors flex items-center justify-center min-w-[110px]"
                    >
                      {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                      <span className="ml-2 font-medium">{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cartão Section */}
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="bg-blue-100 text-blue-700 p-4 rounded-full mb-4">
                  <CreditCard size={36} />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Cartão de Crédito</h3>
                <p className="text-blue-700 mb-8 max-w-xs">
                  Pague sua inscrição de forma segura utilizando seu cartão de crédito
                </p>
                
                <a 
                  href={cardLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center space-x-3 shadow-md w-full max-w-sm justify-center text-lg"
                >
                  <span>Acessar Link de Pagamento</span>
                  <ExternalLink size={24} />
                </a>
                
                <p className="text-sm text-blue-600 mt-8 max-w-xs">
                  Você será redirecionado para um ambiente de pagamento seguro da InfinitePay.
                </p>
              </div>
            </div>
            
            <div className="mt-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">Instruções Importantes:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Após o pagamento via PIX, envie o comprovante para a secretaria para agilizar a baixa.</li>
                <li>Pagamentos no Cartão de Crédito são aprovados automaticamente.</li>
                <li>Caso não possa efetuar o pagamento no momento da inscrição, Não se preocupe, procure um dos responsáveis e negocie modalidade e prazo.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
