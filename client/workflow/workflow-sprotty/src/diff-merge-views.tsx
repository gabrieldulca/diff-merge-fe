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
import { RectangularNodeView, RenderingContext, SShapeElement } from "@eclipse-glsp/client";
import { injectable } from "inversify";
import * as snabbdom from "snabbdom-jsx";
import { VNode } from "snabbdom/vnode";

import { TaskNode } from "./model";

const JSX = { createElement: snabbdom.svg };

@injectable()
export class TestNodeView extends RectangularNodeView {
    render(node: TaskNode, context: RenderingContext): VNode {
        console.log("Using custom view");
        const rcr = this.getRoundedCornerRadius(node);
        const graph = <g>
            <rect class-sprotty-node={true} class-task={true}
                class-automated={node.taskType === 'automated'}
                class-manual={node.taskType === 'manual'}
                class-mouseover={node.hoverFeedback} class-selected={node.selected}
                x={0} y={0} rx={rcr} ry={rcr}
                width={Math.max(0, node.bounds.width)} height={Math.max(0, node.bounds.height)}></rect>
            {context.renderChildren(node)}
        </g>;
        return graph;
    }

    protected getRoundedCornerRadius(node: SShapeElement): number {
        return 5;
    }
}
