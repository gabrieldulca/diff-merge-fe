export const ComparisonServicePath = '/services/comparison-service';


export const ComparisonService = Symbol('ComparisonService');
export interface ComparisonService {
    getComparisonResult(file1Path: string, file2Path: string): Promise<Readonly<{ [key:string]: string | undefined }>>
    getMergeResult(file1Path: string, file2Path: string): Promise<Readonly<{ [key:string]: string | undefined }>>
}
