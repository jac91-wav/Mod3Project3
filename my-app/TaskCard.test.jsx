import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskCard from "./app/components/TaskCard";

describe("TaskCard", () => {
  it("renders the title and description in read-only view", () => {
    render(<TaskCard id={1} title="Buy groceries" description="Milk, eggs, bread" />);

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Milk, eggs, bread")).toBeInTheDocument();
    expect(screen.getByText("No due date")).toBeInTheDocument();
  });

  it("calls onDelete with the task id when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(<TaskCard id="task-7" title="Do laundry" onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("task-7");
  });

  it("switches to the edit form when Edit is clicked and back to view on Cancel", async () => {
    const user = userEvent.setup();
    render(<TaskCard id={1} title="Read a book" />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("Task title")).not.toBeInTheDocument();
    expect(screen.getByText("Read a book")).toBeInTheDocument();
  });

  it("saves trimmed edits and calls onEdit with the updated fields", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(<TaskCard id={5} title="Old title" onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const titleInput = screen.getByPlaceholderText("Task title");
    await user.clear(titleInput);
    await user.type(titleInput, "  New title  ");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(5, {
      title: "New title",
      description: undefined,
      category: undefined,
      dueDate: undefined,
      tags: [],
    });
    expect(screen.getByText("Old title")).toBeInTheDocument();
  });

  it("shows tags and saves edited tags as a cleaned-up list", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(<TaskCard id={2} title="Study" tags={["school"]} onEdit={onEdit} />);

    expect(screen.getByText("#school")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const tagsInput = screen.getByPlaceholderText("Tags, separated by commas");
    await user.clear(tagsInput);
    await user.type(tagsInput, " exam, urgent,, exam ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onEdit).toHaveBeenCalledWith(2, expect.objectContaining({ tags: ["exam", "urgent"] }));
  });
});
