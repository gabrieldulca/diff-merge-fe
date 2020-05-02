export const ComparisonServicePath = '/services/comparison-service';


export const ComparisonService = Symbol('ComparisonService');
export interface ComparisonService {
    getComparisonResult(): Promise<Readonly<{ [key:string]: string | undefined }>>
    getMergeResult(): Promise<Readonly<{ [key:string]: string | undefined }>>
}
