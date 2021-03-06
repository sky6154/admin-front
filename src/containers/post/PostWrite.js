import React from 'react';
import {permissionCheck, Role} from "../../config/Role";
import TextField from "@material-ui/core/es/TextField/TextField";
import MenuItem from "@material-ui/core/es/MenuItem/MenuItem";

import {fetchBoardListTrigger} from "../../redux/actions/board";
import {uploadPostTrigger} from "../../redux/actions/post";

import _ from "lodash";

import {connect} from "react-redux";
import {withRouter} from "react-router";
import PropTypes from 'prop-types';
import BlogEditor from "../../components/BlogEditor";

class PostWrite extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            title: "",
            boardId: -1
        };

        let requiredRoles = [Role.ROLE_ADMIN, Role.ROLE_BLOG];

        permissionCheck(requiredRoles, this.props.history);
    }

    componentDidMount() {
        this.props.fetchBoardListTrigger();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.boardId === -1 && !_.isNil(this.props.boardList) && !_.isEmpty(this.props.boardList)) {
            this.setState({boardId: this.props.boardList[0].boardId});
        }
    }

    handleTargetBoard = () => event => {
        this.setState({boardId: event.target.value});
    };

    printBoardList = (boardList) => {
        if (!_.isNil(boardList) && boardList.length > 0) {

            return <TextField
                id="outlined-select-currency"
                select
                label="Board list"
                className={"textField"}
                value={this.state.boardId}
                onChange={this.handleTargetBoard()}
                SelectProps={{
                    MenuProps: {
                        className: "menu",
                    },
                }}
                margin="normal"
                variant="outlined"
                style={{width: 200}}
            >
                {boardList.map(boardInfo => (
                    <MenuItem key={boardInfo.description} value={boardInfo.boardId}>
                        {boardInfo.description}
                    </MenuItem>
                ))}
            </TextField>;
        }
    };

    handleTitle = (event) => {
        this.setState({title: event.target.value});
    };

    handleSave = (content) => {
        let req = {
            title: this.state.title,
            content: content,
            author: 'develobeer',
            boardId: this.state.boardId
        };

        this.props.uploadPostTrigger(req);
    };


    render() {
        let boardListDropDown = this.printBoardList(this.props.boardList);
        return (
            <div>
                {boardListDropDown}

                <BlogEditor boardId={this.state.boardId} content={this.props.content}/>
            </div>
        );
    }
}


PostWrite.defaultProps = {
    isBoardListFetching: false,
    boardList: []
};

PostWrite.propTypes = {
    isBoardListFetching: PropTypes.bool.isRequired,
    boardList: PropTypes.array.isRequired
};

function mapStateToProps(state) {
    return {
        isBoardListFetching: state.board.isBoardListFetching,
        boardList: state.board.boardList
    };
}


export default withRouter(connect(mapStateToProps, {
    fetchBoardListTrigger,
    uploadPostTrigger
})(PostWrite));