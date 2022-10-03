import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from '@aws-amplify/ui-react';
import { listNotes } from "./graphql/queries";
import { listEntries } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
  createEntry as createEntryMutation,
  deleteEntry as deleteEntryMutation,
} from "./graphql/mutations";

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const apiData = await API.graphql({ query: listEntries });
    const entriesFromAPI = apiData.data.listEntries.items;
    await Promise.all(
      entriesFromAPI.map(async (entry) => {
        return entry;
      })
    );
    setEntries(entriesFromAPI);
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function createEntry(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const data = {
      date: form.get("date"),
      cust: form.get("cust"),
      hours: form.get("hours"),
      comments: form.get("comments"),
    };
    await API.graphql({
      query: createEntryMutation,
      variables: { input: data },
    });    
    fetchEntries();
    event.target.reset();
  }

  async function deleteEntry({ id, cust }) {
    const newEntries = entries.filter((entry) => entry.id !== id);
    setEntries(newEntries);
    await Storage.remove(cust);
    await API.graphql({
      query: deleteEntryMutation,
      variables: { input: { id } },
    });
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>Time Entry</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Note Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />          
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
            {/* 👇️ colored horizontal line */}
            <hr
        style={{
          background: 'lime',
          color: 'lime',
          borderColor: 'lime',
          height: '3px',
        }}
      />
      <View as="form" margin="3rem 0" onSubmit={createEntry}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="cust"
            placeholder="Customer Name"
            label="Customer Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="date"
            placeholder="Date of service"
            label="Date"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="hours"
            placeholder="Hours"
            label="Hours"
            labelHidden
            variation="quiet"
            required
          />
          <Button type="submit" variation="primary">
            Create Entry
          </Button>
        </Flex>
      </View>

      <Heading level={2}>Current Entries</Heading>
      <View margin="3rem 0">
      {entries.map((entry) => (
        <Flex
          key={entry.id || entry.cust}
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Text as="strong" fontWeight={700}>
            {entry.date}
          </Text>
          <Text as="span">{entry.cust}</Text>
          <Button variation="link" onClick={() => deleteEntry(entry)}>
            Delete entry
          </Button>
        </Flex>
      ))}
      </View>

      <Heading level={3}>Current Notes</Heading>
      <View margin="3rem 0">
      {notes.map((note) => (
        <Flex
          key={note.id || note.name}
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Text as="strong" fontWeight={700}>
            {note.name}
          </Text>
          <Text as="span">{note.description}</Text>
          {note.image && (
            <Image
              src={note.image}
              alt={`visual aid for ${notes.name}`}
              style={{ width: 400 }}
            />
          )}
          <Button variation="link" onClick={() => deleteNote(note)}>
            Delete note
          </Button>
        </Flex>
      ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);