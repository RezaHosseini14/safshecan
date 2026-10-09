export function fillOrderTemplate(
  template: string | undefined,
  variables: { symbol: string; price: number; quantity: number }
): string {
  if (!template) return '';

  let replaced = template;
  replaced = replaced.replace(/\{\{symbol\}\}/gi, variables.symbol);
  replaced = replaced.replace(/\{\{price\}\}/gi, variables.price.toString());
  replaced = replaced.replace(/\{\{quantity\}\}/gi, variables.quantity.toString());

  try {
    const parsed = JSON.parse(replaced) as Record<string, unknown>;
    let changed = false;

    for (const key of Object.keys(parsed)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'price' || lowerKey === 'orderprice') {
        parsed[key] = variables.price;
        changed = true;
      } else if (lowerKey === 'quantity' || lowerKey === 'orderquantity' || lowerKey === 'volume') {
        parsed[key] = variables.quantity;
        changed = true;
      } else if (lowerKey === 'symbol' || lowerKey === 'nsccode' || lowerKey === 'symboltitle') {
        if (variables.symbol) {
          parsed[key] = variables.symbol;
          changed = true;
        }
      }
    }

    if (changed) return JSON.stringify(parsed);
  } catch {
    // template is not JSON
  }

  return replaced;
}
