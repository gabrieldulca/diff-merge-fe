import { ComparisonDto } from "@eclipse-glsp-examples/workflow-sprotty/lib/diffmerge";

export const ComparisonServicePath = '/services/comparison-service';


export const ComparisonService = Symbol('ComparisonService');
export interface ComparisonService {
    getThreeWayComparisonResult(basePath: string, file1Path: string, file2Path: string): Promise<ComparisonDto>
    getComparisonResult(file1Path: string, file2Path: string): Promise<ComparisonDto>
    getMergeResult(file1Path: string, file2Path: string): Promise<ComparisonDto>
}
