
import { toPng } from 'html-to-image';
import { Transaction, BusinessSetup } from '../store/mobileStore';

const formatDate = (timestamp: string | number) => {
    if (!timestamp) return new Date().toLocaleString();
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${year}-${month}-${day} ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export const generateReceiptImage = async (
    transaction: Transaction,
    businessSetup: BusinessSetup,
    isReprint: boolean = false
): Promise<string> => {
    // 1. Create container
    const container = document.createElement('div');
    container.id = 'receipt-generator-container';

    // 2. Styles matching receipt-template.html
    // Note: We use inline styles to ensure html-to-image captures them correctly without needing external css processing
    const styles = {
        body: `
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            color: #000;
            margin: 0 auto;
            padding: 10px; /* Slight padding for the image */
            width: 75mm; /* Slightly larger than 70mm to ensure no wrap issues in image */
            background: #fff;
            line-height: 1.2;
        `,
        header: `text-align: center; margin-bottom: 5px;`,
        h1: `font-size: 18px; margin: 0 0 2px 0; text-transform: uppercase;`,
        p: `margin: 2px 0;`,
        separator: `border-top: 1px dashed #000; margin: 5px 0;`,
        table: `width: 100%; border-collapse: collapse;`,
        th: `text-align: left; border-bottom: 1px dashed #000; padding-bottom: 2px;`,
        td: `padding: 2px 0; vertical-align: top;`,
        qty: `width: 15%; text-align: center;`,
        price: `width: 25%; text-align: right;`,
        total: `width: 25%; text-align: right;`,
        row: `display: flex; justify-content: space-between; margin: 2px 0;`,
        totalRow: `font-weight: 900; font-size: 14px; margin-top: 4px; border-top: 1px dashed #000; padding-top: 4px;`,
        footer: `text-align: center; margin-top: 10px; font-size: 11px;`,
        devFooter: `text-align: center; margin-top: 5px; font-size: 10px;`,
        paymentLine: `display: flex; justify-content: space-between; font-size: 12px;`
    };

    // 3. Prepare Data
    const total = transaction.total || 0;
    const subtotal = transaction.subtotal || total; // Simplified if tax separate
    const tax = transaction.tax || 0;
    const paymentMethod = transaction.paymentMethod ? transaction.paymentMethod.toUpperCase() : 'CASH';
    const customer = transaction.creditCustomer || 'Walk Through Customer';

    const itemsHtml = transaction.items.map((item: any) => `
        <tr>
            <td style="${styles.td}">${item.name || item.product?.name || 'Item'}</td>
            <td style="${styles.td} ${styles.qty}">${item.quantity}</td>
            <td style="${styles.td} ${styles.price}">${(item.price || item.product?.price || 0).toFixed(2)}</td>
            <td style="${styles.td} ${styles.total}">${((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    let mpesaDetails = '';
    if (businessSetup.mpesaPaybill) {
        mpesaDetails += `<p style="${styles.p}">Paybill No: <b>${businessSetup.mpesaPaybill}</b> | A/C No: <b>${businessSetup.mpesaAccountNumber || 'Business No'}</b></p>`;
    }
    if (businessSetup.mpesaTill) {
        mpesaDetails += `<p style="${styles.p}; text-align: center;">Pay By Till : <b>${businessSetup.mpesaTill}</b></p>`;
    }
    if (mpesaDetails) {
        mpesaDetails = `
            <div style="${styles.separator}"></div>
            <div style="${styles.header}">
                ${mpesaDetails}
            </div>
        `;
    }

    // 4. Build HTML String
    const html = `
        <div style="${styles.body}">
            <div style="${styles.header}">
                <h1 style="${styles.h1}">${businessSetup.businessName || 'WHIZ POS'}</h1>
                <p style="${styles.p}">KAGWE | ${businessSetup.phone || ''}</p>
                <p style="${styles.p}">${businessSetup.address || ''}</p>
            </div>

            <div style="${styles.separator}"></div>

            <div style="${styles.header}; text-align: left;">
                <p style="${styles.p}">Receipt #: ${transaction.id} ${isReprint ? '(REPRINT)' : ''}</p>
                <p style="${styles.p}">Date: ${formatDate(transaction.timestamp || transaction.date || Date.now())}</p>
                <p style="${styles.p}">Customer: ${customer}</p>
            </div>

            <div style="${styles.separator}"></div>

            <table style="${styles.table}">
                <thead>
                    <tr>
                        <th style="${styles.th}">Item</th>
                        <th style="${styles.th} ${styles.qty}">Qty</th>
                        <th style="${styles.th} ${styles.price}">Price</th>
                        <th style="${styles.th} ${styles.total}">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="${styles.separator}"></div>

            <div>
                <div style="${styles.row}">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style="${styles.row}">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <div style="${styles.row} ${styles.totalRow}">
                    <span>TOTAL:</span>
                    <span>Ksh ${total.toFixed(2)}</span>
                </div>
            </div>

            <div style="${styles.separator}"></div>

            <div style="${styles.header}; text-align: left;">
                <div style="${styles.paymentLine}">
                    <span>Payment : ${paymentMethod}</span>
                    <span>Served By: ${transaction.cashier || transaction.cashierName || 'Cashier'}</span>
                </div>
            </div>

            ${mpesaDetails}

            <div style="${styles.separator}"></div>

            <div style="${styles.footer}">
                <p style="${styles.p}">${businessSetup.receiptHeader || 'Thank you for your business!'}</p>
                ${businessSetup.receiptFooter ? `<p style="${styles.p}">${businessSetup.receiptFooter}</p>` : ''}
            </div>

            <div style="${styles.separator}"></div>

            <div style="${styles.devFooter}">
                <p style="${styles.p}">System Designed and serviced by Whiz tech</p>
                <p style="${styles.p}">Tell: 0740 841 168</p>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // 5. Mount to DOM (hidden but rendered)
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    try {
        // Wait a tick for fonts/layout
        await new Promise(resolve => setTimeout(resolve, 100));

        // 6. Generate Image
        const dataUrl = await toPng(container.firstElementChild as HTMLElement, {
            quality: 1.0,
            pixelRatio: 2, // High res for sharing
            backgroundColor: '#ffffff'
        });

        return dataUrl;
    } finally {
        // 7. Cleanup
        document.body.removeChild(container);
    }
};
