"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,

  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
} from "@mui/material";
import { Send, Message, Check } from "@mui/icons-material";
import API_BASE_URL from "@/config/baseURL";

import withMemberAuth from "@/components/withMemberAuth";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/NavBar";

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  user: { name: string; _id: string }; 
  replies?: Comment[]; 
}

interface Task {
  _id: string;
  status:string
  task: string;
  manager: { name: string; _id: string; role: string };
  startTime: string;
  endTime: string;
  comments: Comment[];
}

const MemberTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);  
 const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState<string>("");
  const [reply, setReply] = useState<{
    commentId: string;
    text: string;
  } | null>(null);
  const { loggedMember,logout } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      if (!loggedMember) return;
      const res = await axios.get<Task[]>(
        `${API_BASE_URL}/task/${loggedMember._id}`
      );
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  

  const handleAddComment = async (taskId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/task/comment/${taskId}`, {
        text: comment,
        user: loggedMember?._id,
      });
      setComment("");
      fetchTasks();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddReply = async (commentId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/task/comment/reply/${commentId}`, {
        text: reply?.text,
        user: loggedMember?._id,
      });
      setReply(null);
      fetchTasks();
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };
   const handleMarkAsStarted = async (taskId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/task/${taskId}`, {
        status: "started",
      });
      fetchTasks();
    } catch (error) {
      console.error("Error marking task as done:", error);
    }
  };
const statusColor = (status: string) => {
  switch (status) {
    case "started":
      return "#153cec";
    case "completed":
      return "#36c622";

    default:
      return "#272033";
  }
};
  return (
    <>
      <Navbar loggedMember={loggedMember} logout={logout} active="task" />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
        <Typography variant="h4" gutterBottom>
          My Tasks
        </Typography>


        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {tasks.map((t) => (
            <Card key={t._id}>
              <CardHeader
                title={t.task}
                subheader={`Assigned by: ${t.manager?.name} | Status: ${t.status}`}
                style={{
                  backgroundColor: statusColor(t.status),
                }}
              />
              <CardContent>
                <Typography variant="body2">
                  Start: {new Date(t.startTime).toLocaleString()} <br />
                  End: {new Date(t.endTime).toLocaleString()}
                </Typography>
                <Button variant="outlined" onClick={() => setSelectedTask(t)}>
                  <Message style={{ marginRight: "2px" }} />
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => handleMarkAsStarted(t._id)}
                  style={{ marginLeft: "8px" }}
                >
                  <Check style={{ marginRight: "8px" }} />
                </Button>
                
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTask && (
          <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)}>
            <DialogTitle>{selectedTask.task}</DialogTitle>
            <DialogContent>
              <div style={{ marginBottom: "16px" }}>
                {selectedTask.comments?.map((comment) => (
                  <div key={comment._id} style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        background: "#f5f5f5",
                        padding: "8px",
                        borderRadius: "4px",
                      }}
                    >
                      <Typography variant="body1">
                        {comment?.user?.name}: {comment?.text}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          setReply({ commentId: comment._id, text: "" })
                        }
                      >
                        Reply
                      </Button>
                      {comment.replies?.map((replyComment) => (
                        <div
                          key={replyComment._id}
                          style={{ marginLeft: "20px", marginTop: "8px" }}
                        >
                          <Typography
                            variant="body2"
                            style={{
                              background: "#e0e0e0",
                              padding: "4px",
                              borderRadius: "4px",
                            }}
                          >
                            {replyComment.user.name}: {replyComment.text}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {reply && (
                <div>
                  <TextField
                    placeholder="Add a reply..."
                    fullWidth
                    value={reply.text}
                    onChange={(e) =>
                      setReply({ ...reply, text: e.target.value })
                    }
                  />
                  <IconButton
                    onClick={() => handleAddReply(reply.commentId)}
                    color="primary"
                  >
                    <Send />
                  </IconButton>
                </div>
              )}
              <TextField
                placeholder="Add a comment..."
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <IconButton
                onClick={() => handleAddComment(selectedTask._id)}
                color="primary"
              >
                <Send />
              </IconButton>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default withMemberAuth(MemberTasks);
