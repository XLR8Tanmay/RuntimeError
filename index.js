const express=require('express');
const app=express();
const {WebhookClient}=require("dialogflow-fulfillment");
const {Payload} = require("dialogflow-fulfillment");
var randomstring=require("randomstring");
const MongoClient=require('mongodb').MongoClient;
var url="mongodb://localhost:27017/";

var user_name="";

app.post("/dialogflow", expess.json(), (req,res)=>
{
    const agent=new WebhookClient({request:req, response:res});
    async function identify_user(agent)
    {
        const account_number=agent.parameters.account_number;
        const client=new MongoClient(url);
        await client.connect();
        const snap=await client.db('Chatbot').collection('userInfo').findOne({account_number:account_number});
        if(snap==null)
            await agent.add("Account Unidentified! Please re-enter account number: ");
        else
        {
            user_name=snap.username;
            await agent.add("Welcome "+user_name+"! \n How may I help you today?");
        }
    }
});