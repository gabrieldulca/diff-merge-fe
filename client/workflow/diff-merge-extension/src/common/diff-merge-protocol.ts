import { ComparisonDto } from "@eclipse-glsp-examples/workflow-sprotty/lib/diffmerge";

export const ComparisonServicePath = '/services/comparison-service';


export const ComparisonService = Symbol('ComparisonService');
export interface ComparisonService {
    getThreeWayComparisonResult(basePath: string, file1Path: string, file2Path: string): Promise<ComparisonDto>
    getComparisonResult(file1Path: string, file2Path: string): Promise<ComparisonDto>
    getMergeResult(file1Path: string, file2Path: string): Promise<ComparisonDto>
    getThreeWayMergeResult(basePath: string, file1Path: string, file2Path: string): Promise<ComparisonDto>
    getThreeWayMergeNoConflicts(basePath: string, file1Path: string, toBeMerged: string[]): Promise<ComparisonDto>
    getSingleMergeResult(file1Path: string, file2Path: string, element: string, revert: boolean): Promise<ComparisonDto>
    revertFiles(file1Path: string, file2Path: string): Promise<ComparisonDto>
    revertFiles3w(file1Path: string, basePath: string, file2Path: string): Promise<ComparisonDto>
    saveFiles(file1Path: string, file2Path: string): Promise<ComparisonDto>
    saveFiles3w(file1Path: string, basePath: string, file2Path: string): Promise<ComparisonDto>
}
