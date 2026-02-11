import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FullQuote {
    total: number;
    items: Array<QuoteItem>;
    header: QuoteHeader;
}
export interface UploadedFile {
    id: string;
    contentType: string;
    name: string;
    size: bigint;
    blobId: string;
}
export interface QuoteHistoryItem {
    id: string;
    total: number;
    timestamp: bigint;
    items: Array<QuoteItem>;
    header: QuoteHeader;
}
export interface RateCard {
    items: Array<RateCardItem>;
}
export interface AnalysisSummary {
    totalProfit: number;
    totalMargin: number;
    items: Array<AnalysisItem>;
}
export interface AnalysisItem {
    id: string;
    total: number;
    duration: bigint;
    subcategory: string;
    marginPercentage: number;
    quantity: bigint;
    category: string;
    margin: number;
    detailedDescription: string;
    standardCost: number;
    itemRefNo: string;
    opsBriskCost: number;
}
export interface AccountManager {
    id: string;
    name: string;
    email?: string;
}
export interface AccountManagerList {
    managers: Array<AccountManager>;
}
export interface Quote {
    total: number;
    items: Array<QuoteItem>;
}
export interface RateCardItem {
    id: string;
    subcategory: string;
    category: string;
    detailedDescription: string;
    standardCost: number;
    itemRefNo: string;
    opsBriskCost: number;
}
export interface QuoteHeader {
    projectDuration: string;
    projectName: string;
    clientName: string;
    accountManager: string;
}
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    accountManagerId: string;
    phone: string;
}
export interface QuoteItem {
    id: string;
    total: number;
    duration: bigint;
    subcategory: string;
    quantity: bigint;
    category: string;
    detailedDescription: string;
    standardCost: number;
    itemRefNo: string;
    opsBriskCost: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAccountManager(manager: AccountManager): Promise<void>;
    addRateCardItem(item: RateCardItem): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAccountManager(id: string): Promise<void>;
    deleteRateCardItem(id: string): Promise<void>;
    generateAnalysis(selectedItems: Array<[string, bigint, bigint]>): Promise<AnalysisSummary>;
    generateFullQuote(header: QuoteHeader, selectedItems: Array<[string, bigint, bigint]>): Promise<FullQuote>;
    generateQuote(selectedItems: Array<[string, bigint, bigint]>): Promise<Quote>;
    getAccountManagers(): Promise<AccountManagerList>;
    getAllRateCardItems(): Promise<Array<RateCardItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getQuoteHistory(): Promise<Array<QuoteHistoryItem>>;
    getQuoteHistoryItem(id: string): Promise<QuoteHistoryItem | null>;
    getRateCard(): Promise<RateCard>;
    getRateCardItem(id: string): Promise<RateCardItem | null>;
    getUploadedFiles(): Promise<Array<UploadedFile>>;
    getUserProfile(id: string): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    trackUploadedFile(file: UploadedFile): Promise<void>;
    updateAccountManager(manager: AccountManager): Promise<void>;
    updateAccountManagers(newManagers: Array<AccountManager>): Promise<void>;
    updateRateCard(newItems: Array<RateCardItem>): Promise<void>;
    updateRateCardItem(item: RateCardItem): Promise<void>;
    updateStandardCost(itemId: string, newStandardCost: number): Promise<void>;
}
