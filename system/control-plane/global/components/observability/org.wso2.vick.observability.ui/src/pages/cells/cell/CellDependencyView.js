/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import DependencyGraph from "../../common/DependencyGraph";
import PropTypes from "prop-types";
import React from "react";
import {withStyles} from "@material-ui/core";
import withColor, {ColorGenerator} from "../../common/color";
import StateHolder from "../../common/state/stateHolder";
import QueryUtils from "../../common/utils/queryUtils";
import NotificationUtils from "../../common/utils/notificationUtils";
import HttpUtils from "../../common/utils/httpUtils";
import withGlobalState from "../../common/state";

const styles = () => ({
    graph: {
        width: "100%",
        height: "100%"
    }
});

const graphConfig = {
    directed: true,
    automaticRearrangeAfterDropNode: false,
    collapsible: false,
    height: 500,
    highlightDegree: 1,
    highlightOpacity: 0.2,
    linkHighlightBehavior: false,
    maxZoom: 8,
    minZoom: 1,
    nodeHighlightBehavior: true,
    panAndZoom: false,
    staticGraph: false,
    width: 1000,
    d3: {
        alphaTarget: 0.05,
        gravity: -700,
        linkLength: 150,
        linkStrength: 1
    },
    node: {
        color: "#d3d3d3",
        fontColor: "black",
        fontSize: 18,
        fontWeight: "normal",
        highlightColor: "red",
        highlightFontSize: 18,
        highlightFontWeight: "bold",
        highlightStrokeColor: "SAME",
        highlightStrokeWidth: 1.5,
        labelProperty: "name",
        mouseCursor: "pointer",
        opacity: 1,
        renderLabel: true,
        size: 600,
        strokeColor: "green",
        strokeWidth: 2
    },
    link: {
        color: "#d3d3d3",
        opacity: 1,
        semanticStrokeWidth: false,
        strokeWidth: 4,
        highlightColor: "black"
    }
};

class CellDependencyView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: {
                nodes: {},
                links: {}
            }
        };
        graphConfig.node.viewGenerator = this.viewGenerator;
    }

    componentDidMount = () => {
        const {globalState} = this.props;

        this.update(
            true,
            QueryUtils.parseTime(globalState.get(StateHolder.GLOBAL_FILTER).startTime).valueOf(),
            QueryUtils.parseTime(globalState.get(StateHolder.GLOBAL_FILTER).endTime).valueOf()
        );
    };

    update = (isUserAction, queryStartTime, queryEndTime) => {
        const {globalState, cell} = this.props;
        const self = this;

        const search = {
            fromTime: queryStartTime.valueOf(),
            toTime: queryEndTime.valueOf(),
        };

        if (isUserAction) {
            NotificationUtils.showLoadingOverlay("Loading Cell Dependency Graph", globalState);
        }
        HttpUtils.callObservabilityAPI(
            {
                url: `/dependency-model/cells/${cell}${HttpUtils.generateQueryParamString(search)}`,
                method: "GET"
            },
            globalState
        ).then((data) => {
            console.log(data);
            self.setState({
                data: {
                    nodes: data.nodes,
                    links: data.edges
                }
            });
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
            }
        }).catch(() => {
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
                NotificationUtils.showNotification(
                    "Failed to load cell dependency view",
                    NotificationUtils.Levels.ERROR,
                    globalState
                );
            }
        });
    };

    viewGenerator = (nodeProps) => {
        const nodeId = nodeProps.id;
        const color = this.props.colorGenerator.getColor(nodeId);
        return <svg x="0px" y="0px"
                    width="50px" height="50px" viewBox="0 0 240 240">
            <polygon fill={color} points="224,179.5 119.5,239.5 15,179.5 15,59.5 119.5,-0.5 224,59.5 "/>
        </svg>;
    };

    onClickCell = (nodeId) => {
        //TODO: redirect to another cell view.
    };

    render = () => {
        return (
            <React.Fragment>
                <DependencyGraph
                    id="cell-dependency-graph"
                    data={this.state.data}
                    config={graphConfig}
                    reloadGraph={true}
                    onClickNode={this.onClickCell}
                    onClickGraph={this.onClickGraph}
                />
            </React.Fragment>
        )
    };

}

CellDependencyView.propTypes = {
    classes: PropTypes.object.isRequired,
    cell: PropTypes.string.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    colorGenerator: PropTypes.instanceOf(ColorGenerator).isRequired
};

export default withStyles(styles, {withTheme: true})(withColor(withGlobalState(CellDependencyView)));
