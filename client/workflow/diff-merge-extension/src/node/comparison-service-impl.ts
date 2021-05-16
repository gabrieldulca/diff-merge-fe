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

    async saveFiles(file1Path: string, file2Path: string): Promise<ComparisonDto> {
        console.log("revert link", 'http://localhost:8080/diff/save/diagram?file1=' + file1Path + '&file2=' + file2Path);
        const resp = fetch('http://localhost:8080/diff/save/diagram?file1=' + file1Path + '&file2=' + file2Path)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        return resp;
    }

    async revertFiles(file1Path: string, file2Path: string): Promise<ComparisonDto> {
        console.log("revert link", 'http://localhost:8080/diff/revert/diagram?file1=' + file1Path + '&file2=' + file2Path);
        const resp = fetch('http://localhost:8080/diff/revert/diagram?file1=' + file1Path + '&file2=' + file2Path)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        return resp;
    }

    async revertFiles3w(file1Path: string, basePath: string, file2Path: string): Promise<ComparisonDto> {
        console.log("revert link", 'http://localhost:8080/diff/revert3w/diagram?file1=' + file1Path + '&base=' + basePath + '&file2=' + file2Path);
        const resp = fetch('http://localhost:8080/diff/revert3w/diagram?file1=' + file1Path + '&base=' + basePath + '&file2=' + file2Path)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        return resp;
    }

    async getSingleMergeResult(file1Path: string, file2Path: string, element: string, revert: boolean): Promise<ComparisonDto> {
        console.log("merge link", 'http://localhost:8080/diff/merge/diagram?file1=' + file1Path + '&file2=' + file2Path);
        console.log("element to be merged", element);
        console.log("revert", revert);
        const resp = fetch('http://localhost:8080/diff/mergesingle/diagram?file1=' + file1Path + '&file2=' + file2Path
            + '&elem=' + element + '&revert=' + revert)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        console.log("getSingleMergeResult", resp);

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
