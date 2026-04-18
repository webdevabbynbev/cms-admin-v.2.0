import http from "./http";

// Shape dari wrapper backend: { status: 'success', data: T }
interface ApiResponse<T> {
    status: string;
    data: T;
}

export interface SeoSummary {
    metrics: {
        totalUsers: number;
        newUsers: number;
    };
    traffic_source: Array<{ name: string; value: number }>;
}

export interface TrafficReport {
    traffic_source: Array<{ name: string; value: number }>;
    top_pages: Array<{
        page: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
    }>;
}

export interface SeoPerformance {
    blog: { clicks: number; impressions: number };
    ecommerce: { clicks: number; impressions: number };
}

export const getSeoDashboardSummary = async (start_date?: string, end_date?: string): Promise<SeoSummary> => {
    const res = await http.get<ApiResponse<SeoSummary>>("/admin/seo/dashboard-summary", {
        params: { start_date, end_date },
    });
    return res.data.data;
};

export const getSeoTrafficReport = async (start_date?: string, end_date?: string): Promise<TrafficReport> => {
    const res = await http.get<ApiResponse<TrafficReport>>("/admin/seo/traffic-report", {
        params: { start_date, end_date },
    });
    return res.data.data;
};

export const getSeoPerformance = async (start_date?: string, end_date?: string): Promise<SeoPerformance> => {
    const res = await http.get<ApiResponse<SeoPerformance>>("/admin/seo/performance", {
        params: { start_date, end_date },
    });
    return res.data.data;
};
