import { ComparisonDto } from "@eclipse-glsp-examples/workflow-sprotty/lib/diffmerge";
import { injectable } from "inversify";

import { ComparisonService } from "../common";

const fetch = require("node-fetch");

@injectable()
export class ComparisonServiceImpl implements ComparisonService {

    async getMergeResult(file1Path: string, file2Path: string): Promise<ComparisonDto> {
        console.log("merge link", 'http://localhost:8080/diff/merge/diagram?file1=' + file1Path + '&file2=' + file2Path);
        const resp = fetch('http://localhost:8080/diff/merge/diagram?file1=' + file1Path + '&file2=' + file2Path)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        console.log("getMergeResult", resp);

        return resp;
    }

    async getComparisonResult(file1Path: string, file2Path: string): Promise<ComparisonDto> {
        console.log('http://localhost:8080/diff/compare/diagram?file1=' + file1Path + '&file2=' + file2Path);

        // @ts-ignore
        const resp = fetch('http://localhost:8080/diff/compare/diagram?file1=' + file1Path + '&file2=' + file2Path)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        console.log("getComparisonResult", resp);

        return resp;
    }

    async getThreeWayComparisonResult(basePath: string, file1Path: string, file2Path: string): Promise<ComparisonDto> {
        console.log('http://localhost:8080/diff/compareThreeWay/diagram?base=' + basePath + '&file1=' + file1Path + '&file2=' + file2Path);

        // @ts-ignore
        const resp = fetch('http://localhost:8080/diff/compareThreeWay/diagram?base=' + basePath + '&file1=' + file1Path + '&file2=' + file2Path)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        console.log("get3WayComparisonResult", resp);

        return resp;
    }
}
