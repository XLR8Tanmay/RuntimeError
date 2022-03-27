const express = require("express");
const app=express();
const {WebhookClient} =  require("dialogflow-fulfillment");
const {Payload} = require("dialogflow-fulfillment");
var randomstring = require("randomstring");

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

var user_name="";
app.post("/dialogflow", express.json(), (req,res) => {
    const agent = new WebhookClient({ request: req, response: res});

async function identify_user(agent)
{
    const acNumber=agent.parameters.acNumber;
    const client=new MongoClient(url);
    await client.connect();
    const snap = await client.db('Chatbot').collection('userInfo').findOne({acNumber:acNumber});

    if(snap==null)
        await agent.add("Account Unidentified! Please re-enter:");
    else
    {
        user_name=snap.username;
        await agent.add("Welcome "+user_name+"! \n How may I help you today?");
    }
}

async function buyItemHandler(agent)
{
    const product_name=agent.parameters.product_name;
    const client=new MongoClient(url);
    await client.connect();
    const details=await client.db('Chatbot').collection('productData').findOne({product_name:product_name});
    if(details==null)
        await agent.add("Product not available in database.");
    else
    {
        await agent.add("The product "+product_name+" has been purchased for "+details.price);
    }
}
async function getItemDetails(agent)
{
    const product_name=agent.parameters.product_name;
    const client=new MongoClient(url);
    await client.connect();
    const details=await client.db('Chatbot').collection('productData').findOne({product_name:product_name});
    if(details==null)
        await agent.add("Product not available in database! Search for another product.");
    else
    {
        product_price=details.price;
        await agent.add("Price of "+product_name+" is "+product_price);
    }
}
function report_issue(agent)
{
    var issue_values={1:"Order Delayed",2:"Damaged Product",3:"Refund Status",4:"Other"};
    const intent_val=agent.parameters.issue_number;
    var val=issue_values[intent_val];
    var trouble_ticket=randomstring.generate(10);

    MongoClient.connect(url,function(err,db)
    {
        if (err) throw err;
        var dbo=db.db("Chatbot");

        var uname=user_name;
        var issue_val=val;
        var status="pending";

        let ts=Date.now();
        let date_ob=new Date(ts);
        let date=date_ob.getDate();
        let month=date_ob.getMonth()+1;
        let year=date_ob.getFullYear();

        var time_date=year+"-"+month+"-"+date;
        var myobj={username:uname,issue:issue_values,status:status,time_date:time_date,trouble_ticket:trouble_ticket};
        
        dbo.collection("Issues").insertOne(myobj,function(err,res){
            if (err) throw err;
            db.close();
        })
    });
    agent.add("The issue reported is: "+val+"\n"+"The ticket number is: "+trouble_ticket);
    agent.add("Your issue will be resolved as soon as possible!\n Thanks for choosing Archeus!!");
}

async function problem_status(agent)
{
    const trouble_ticket=agent.parameters.trouble_ticket;
    const client=new MongoClient(url);
    await client.connect();
    const snap = await client.db('Chatbot').collection('Issues').findOne({trouble_ticket:trouble_ticket});

    if(snap==null)
        await agent.add("Ticket Number Unidentified! Please re-enter.");
    else
    {
        const ticket_status=snap.status;
        await agent.add("Your ticket status is: "+ ticket_status);
    }
}

function custom_payload(agent)
{
    var payLoadData={"richContent":[[
    {
        "type":"list","title":"Order Delayed","subtitle":"Press 1 for Delay in orders",
        "event":{"name":"","languageCode":"","parameters":{}}
    },
    {
        "type":"divider"
    },
    {
        "type":"list","title":"Damaged Product Received","subtitle":"Press 2 if you have received a damaged product",
        "event":{"name":"","languageCode":"","parameters":{}}
    },
    {
        "type":"divider"
    },
    {
        "type":"list","title":"Refund Status","subtitle":"Press 3 for getting your refund related queries",
        "event":{"name":"","languageCode":"","parameters":{}}
    },
    {
        "type":"divider"
    },
    {
        "type":"list","title":"Other","subtitle":"Press 4 for other queries.",
        "event":{"name":"","languageCode":"","parameters":{}}
    }
    ]]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true,rawPayload:true}));
}

var intentMap=new Map();
intentMap.set("service_intent", identify_user);
intentMap.set("service_intent-Issue-IssueNumber", report_issue);
intentMap.set("service_intent-Issue", custom_payload);
intentMap.set("service_intent-Ticket-TicketStatus",problem_status);
intentMap.set("service_intent-getProductDetails", getItemDetails);
intentMap.set("service_intent-buyItem", buyItemHandler);

agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 2100);