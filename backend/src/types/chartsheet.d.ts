declare module "chartsheet" {
  export interface ChartSeriesSpec {
    ref: string;
    nameRef?: string;
    name?: string;
    colour?: string;
    color?: string;
    xRef?: string;
  }

  export interface ChartSpec {
    type?: "bar" | "column" | "line" | "pie" | "doughnut" | "area" | "scatter" | "radar";
    title?: string;
    series: ChartSeriesSpec[];
    categories?: string;
    sheet?: string;
    anchor?: { col?: number; row?: number; colOffset?: number; rowOffset?: number };
    width?: number;
    height?: number;
    stacked?: boolean;
    horizontal?: boolean;
    dataLabels?: boolean;
    legend?: "r" | "l" | "t" | "b" | false;
    numberFormat?: string;
    gridlines?: boolean;
    xTitle?: string;
    yTitle?: string;
    name?: string;
  }

  export function addChart(workbook: Buffer | Uint8Array | ArrayBuffer, spec: ChartSpec): Promise<Buffer>;
  export function addCharts(workbook: Buffer | Uint8Array | ArrayBuffer, specs: ChartSpec[]): Promise<Buffer>;
  export function validate(workbook: Buffer | Uint8Array | ArrayBuffer): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}
