/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

export class DiffTreeNode {

    id: string;
    modelElementId: string;
    diffSource?: string | undefined;
    name: string;
    visible: boolean = true;
    selected: boolean = false;
    changeType: string;
    elementType?: string | undefined;
    source?: string | undefined;
    target?: string | undefined;
    parent: DiffTreeNode | undefined = undefined;

}

export class ChangedElem {

    id: string;
    name: string;
    changeType: string;
    source?: string | undefined;
    target?: string | undefined;
    diffSource?: string | undefined;

    constructor(id: string, name: string, changeType: string) {
        this.id = id;
        this.name = name;
        this.changeType = changeType;
    }
}

export class ComparisonDto {

    matches: MatchDto[];
    threeWay: boolean;

}

export class MatchDto {

    subMatches: MatchDto[];
    left: DiagElementDto;
    origin: DiagElementDto;
    right: DiagElementDto;
    diffs: DiffDto[];

}

export class DiagElementDto {

    id: string;
    name: string;
    target: string;
    type: string;
}

export class DiffDto {

    attribute: string;
    conflict: string;
    kind: string;
    parent: string;
    referenceDto: string;
    referenceType: string;
    type: string;
    value: string;
}
